import { readDb } from "@/lib/supabase/read";
import type { Entry } from "./types";

/**
 * 읽기 경계(ADR-0002·0022). Supabase에서 published 글만 읽는다(RLS도 이중 보호).
 * 본문은 마크다운 원문이며 렌더는 화면(.prose)에서 한다(ADR-0014).
 *
 * 글의 정본은 노션이지만 화면은 노션을 직접 조회하지 않는다 — 동기화가 채운 DB만 읽는다.
 * 렌더 경로에 외부 서비스가 끼면 그 장애가 곧 사이트 장애가 되기 때문이다.
 *
 * 읽기는 쿠키 없는 익명 클라이언트를 쓴다(ADR-0045). 그래야 화면을 캐시할 수 있다.
 */

type Row = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  entry_date: string | null;
  published_at: string | null;
  updated_at: string | null;
  /** 태그는 조인이 아니라 배열 컬럼이다(0008_tags_as_array.sql) */
  tags: string[] | null;
};

const SELECT =
  "slug, title, excerpt, content, cover_image, entry_date, published_at, updated_at, tags";

function toEntry(r: Row): Entry {
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? "",
    date: r.entry_date ?? (r.published_at ? r.published_at.slice(0, 10) : ""),
    publishedAt: r.published_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
    tags: r.tags?.length ? r.tags : undefined,
    coverImage: r.cover_image ?? undefined,
    body: typeof r.content === "string" ? r.content : "",
  };
}

/** 최근 글 n개 — 홈에서 쓴다. */
export async function getRecent(limit: number): Promise<Entry[]> {
  const { data } = await readDb
    .from("posts")
    .select(SELECT)
    .eq("status", "published")
    .order("entry_date", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Row[]).map(toEntry);
}

/** 전체 목록 — 태그 필터는 걷어냈다(ADR-0034) */
export async function getList(): Promise<Entry[]> {
  const { data } = await readDb
    .from("posts")
    .select(SELECT)
    .eq("status", "published")
    .order("entry_date", { ascending: false });
  return ((data ?? []) as Row[]).map(toEntry);
}

/** 상세 1건 */
export async function getBySlug(slug: string): Promise<Entry | null> {
  const { data } = await readDb
    .from("posts")
    .select(SELECT)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  return data ? toEntry(data as Row) : null;
}

/**
 * 인접 글 — 상세 하단 내비용. prev=더 오래된, next=더 최근.
 * 다 읽은 직후가 이탈이 가장 큰 순간이라, 여기서 다음 글을 권한다(피크엔드 법칙, ADR-0025).
 */
export async function getAdjacent(
  slug: string,
): Promise<{ prev: Entry | null; next: Entry | null }> {
  const list = await getList();
  const i = list.findIndex((e) => e.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: list[i + 1] ?? null,
    next: list[i - 1] ?? null,
  };
}
