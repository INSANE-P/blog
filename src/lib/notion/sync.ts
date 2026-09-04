/**
 * 노션 → Supabase 동기화 (ADR-0022).
 *
 * 단방향이다. 노션이 항상 이긴다 — 앱에서 글을 고치지 않으므로 충돌이 없다.
 * 경계 상황의 판단 근거는 docs/notion-sync-design.md 3.1 에 있다.
 */

import { createClient } from "@supabase/supabase-js";
import { listPages, fetchMarkdown, toPost, type NotionPost } from "./client";
import { htmlToMarkdown } from "./html-to-markdown";

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
};

/** 글 하나를 DB에 반영한다. 태그는 배열 컬럼이라 덮어쓰면 끝난다(멱등). */
async function upsertPost(
  supabase: ReturnType<typeof db>,
  post: NotionPost,
): Promise<void> {
  const row = {
    notion_page_id: post.pageId,
    slug: post.slug,
    title: post.title,
    excerpt: post.summary,
    content: post.body,
    cover_image: post.coverUrl ?? null,
    entry_date: post.date || null,
    tags: post.tags,
    // 발행 체크가 꺼지면 draft — "지운다"가 아니라 "감춘다"는 의도다
    status: post.published ? "published" : "draft",
    published_at: post.published ? new Date().toISOString() : null,
    synced_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("posts")
    .upsert(row, { onConflict: "notion_page_id" });
  if (error) throw new Error(error.message);
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
  const result: SyncResult = { synced: [], skipped: [], removed: [], failed: [] };

  const pages = await listPages();

  for (const page of pages) {
    let slug = "(알 수 없음)";
    try {
      const raw = await fetchMarkdown(page.id);
      const post = toPost(page, htmlToMarkdown(raw));
      slug = post.slug || "(슬러그 없음)";

      // 슬러그가 없으면 URL을 만들 수 없다 — 반영하지 않고 실패로 집계한다
      if (!post.slug) {
        result.skipped.push({ slug: post.title, reason: "슬러그가 비어 있음" });
        continue;
      }

      await upsertPost(supabase, post);
      result.synced.push(post.slug);
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
