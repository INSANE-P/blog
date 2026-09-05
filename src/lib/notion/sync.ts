/**
 * 노션 → Supabase 동기화 (ADR-0022).
 *
 * 단방향이다. 노션이 항상 이긴다 — 앱에서 글을 고치지 않으므로 충돌이 없다.
 * 경계 상황의 판단 근거는 docs/notion-sync-design.md 3.1 에 있다.
 */

import { createClient } from "@supabase/supabase-js";
import { listPages, fetchMarkdown, toPost, type NotionPost } from "./client";
import { htmlToMarkdown } from "./html-to-markdown";
import { migrateBodyImages, migrateImage } from "./images";

/**
 * 동기화는 로그인 세션이 아니라 토큰으로 인증된다.
 * posts 쓰기는 authenticated 역할만 가능하므로(0001_init.sql) service role 로 RLS를 넘는다.
 * 이 키는 서버에서만 쓰인다 — NEXT_PUBLIC 접두사를 붙이면 안 된다.
 */
function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수가 없습니다");
  return createClient(url, key, { auth: { persistSession: false } });
}

export type SyncResult = {
  synced: string[];
  skipped: { slug: string; reason: string }[];
  removed: string[];
  failed: { slug: string; error: string }[];
  /** 이미지 이관에 실패한 글. 글은 반영되지만 그 이미지는 곧 만료돼 깨진다. */
  imageFailures: { slug: string; count: number }[];
  /**
   * 노션이 내보냈지만 우리가 뜻을 모르는 태그. 글자는 살렸지만 모양은 잃었다.
   * 조용히 두면 노션이 블록을 새로 추가했을 때 글이 깨진 채로 몇 달을 간다.
   */
  unknownTags: { slug: string; tags: string[] }[];
};

/** 글 하나를 DB에 반영한다. 태그는 배열 컬럼이라 덮어쓰면 끝난다(멱등). */
/*
  글 하나를 반영한다 (ADR-0044).

  **바뀐 것이 없으면 쓰지 않는다.** 예전에는 동기화할 때마다 모든 글을 덮었는데,
  그러면 `updated_at` 트리거가 매번 돌아 "모든 글이 방금 수정됐다"가 된다.
  사이트맵의 갱신 시각과 구조화 데이터의 `dateModified` 가 그 값을 쓰므로,
  크롤러에게 매 동기화마다 전부 바뀌었다고 거짓말하게 된다.

  `synced_at` 은 이 경우 갱신되지 않는다. 읽는 곳이 없는 참고용 값이고,
  그것 하나를 위해 `updated_at` 을 망치는 것이 더 큰 손해다.

  **발행 시각도 한 번만 찍는다.** 예전에는 `published_at` 에 매번 `now()` 를 넣어
  발행일이 동기화할 때마다 앞으로 밀렸다. 처음 발행된 순간을 남기고 그 뒤로는 지킨다.
*/
type ExistingRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  entry_date: string | null;
  tags: string[] | null;
  status: string;
  published_at: string | null;
};

const CONTENT_FIELDS = [
  "slug",
  "title",
  "excerpt",
  "content",
  "cover_image",
  "entry_date",
  "tags",
  "status",
] as const;

/** 두 행의 내용이 같은가 — 태그는 순서까지 본다(노션이 순서를 지킨다) */
function sameContent(a: ExistingRow, b: Record<string, unknown>): boolean {
  return CONTENT_FIELDS.every((k) => {
    const x = a[k];
    const y = b[k];
    if (Array.isArray(x) || Array.isArray(y)) {
      return JSON.stringify(x ?? []) === JSON.stringify(y ?? []);
    }
    return (x ?? null) === (y ?? null);
  });
}

/** @returns 실제로 썼으면 true, 바뀐 것이 없어 건너뛰었으면 false */
async function upsertPost(supabase: ReturnType<typeof db>, post: NotionPost): Promise<boolean> {
  const { data: existing } = await supabase
    .from("posts")
    .select("slug, title, excerpt, content, cover_image, entry_date, tags, status, published_at")
    .eq("notion_page_id", post.pageId)
    .maybeSingle();

  const prev = (existing as ExistingRow | null) ?? null;

  const content = {
    slug: post.slug,
    title: post.title,
    excerpt: post.summary,
    content: post.body,
    cover_image: post.coverUrl ?? null,
    entry_date: post.date || null,
    tags: post.tags,
    // 발행 체크가 꺼지면 draft — "지운다"가 아니라 "감춘다"는 의도다
    status: post.published ? "published" : "draft",
  };

  if (prev && sameContent(prev, content)) return false;

  const row = {
    notion_page_id: post.pageId,
    ...content,
    // 이미 발행된 글은 처음 찍힌 시각을 지킨다
    published_at: post.published ? (prev?.published_at ?? new Date().toISOString()) : null,
    synced_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("posts").upsert(row, { onConflict: "notion_page_id" });
  if (error) throw new Error(error.message);
  return true;
}

/**
 * 노션에서 사라진 글을 DB에서 지운다.
 *
 * 감추지 않고 지우는 이유: 노션이 휴지통에 30일 보관하므로 복구 경로가 이미 있다.
 * 남겨두면 노션에 원본이 없어 되살릴 수도 정리할 수도 없는 유령 데이터가 쌓인다.
 */
async function removeGone(
  supabase: ReturnType<typeof db>,
  livePageIds: string[],
): Promise<string[]> {
  const { data } = await supabase
    .from("posts")
    .select("id, slug, notion_page_id")
    .not("notion_page_id", "is", null);
  if (!data?.length) return [];

  const gone = data.filter((r) => !livePageIds.includes(r.notion_page_id as string));
  if (gone.length === 0) return [];

  await supabase
    .from("posts")
    .delete()
    .in(
      "id",
      gone.map((r) => r.id),
    );
  return gone.map((r) => r.slug as string);
}

/**
 * 전체 동기화.
 * 한 글이 실패해도 나머지는 반영한다 — 글 하나 때문에 전부 막히면 안 된다.
 * 대신 실패가 하나라도 있으면 호출자가 5xx로 응답한다(조용한 실패가 가장 나쁘다).
 */
export async function syncFromNotion(): Promise<SyncResult> {
  const supabase = db();
  const result: SyncResult = {
    synced: [],
    skipped: [],
    removed: [],
    failed: [],
    imageFailures: [],
    unknownTags: [],
  };

  const pages = await listPages();

  for (const page of pages) {
    let slug = "(알 수 없음)";
    try {
      const raw = await fetchMarkdown(page.id);
      const converted = htmlToMarkdown(raw);
      const post = toPost(page, converted.markdown);
      slug = post.slug || "(슬러그 없음)";

      // 슬러그가 없으면 URL을 만들 수 없다 — 반영하지 않고 실패로 집계한다
      if (!post.slug) {
        result.skipped.push({ slug: post.title, reason: "슬러그가 비어 있음" });
        continue;
      }

      // 노션 이미지 URL은 한 시간이면 만료된다. 본문과 커버를 R2로 옮긴다.
      const migrated = await migrateBodyImages(post.body);
      post.body = migrated.body;
      if (migrated.failed > 0) {
        result.imageFailures.push({ slug: post.slug, count: migrated.failed });
      }

      if (post.coverUrl) {
        try {
          post.coverUrl = await migrateImage(post.coverUrl);
        } catch {
          // 커버가 실패하면 만료될 URL이 남는다. 글은 살리되 알린다.
          result.imageFailures.push({ slug: post.slug, count: 1 });
        }
      }

      if (converted.unknownTags.length > 0) {
        result.unknownTags.push({ slug: post.slug, tags: converted.unknownTags });
      }

      const written = await upsertPost(supabase, post);
      if (written) result.synced.push(post.slug);
      else result.skipped.push({ slug: post.slug, reason: "바뀐 것이 없음" });
    } catch (e) {
      result.failed.push({ slug, error: e instanceof Error ? e.message : String(e) });
    }
  }

  result.removed = await removeGone(
    supabase,
    pages.map((p) => p.id),
  );

  return result;
}
