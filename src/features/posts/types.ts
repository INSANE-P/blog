/**
 * 콘텐츠 도메인 타입 (ADR-0022·0025).
 *
 * 글의 종류(기록/이야기)를 나누지 않는다. 쓸 때마다 분류를 결정하는 마찰을 없애고,
 * 글이 적을 때 목록이 갈려 빈약해 보이는 것을 피하기 위해서다.
 */
export type Entry = {
  slug: string;
  title: string;
  excerpt: string;
  /** "YYYY-MM-DD" */
  date: string;
  tags?: string[];
  /** 목록 썸네일. 노션 페이지 커버 → 본문 첫 이미지 순으로 채워진다. */
  coverImage?: string;
  /** 본문 마크다운 원문 */
  body?: string;
};

/** 글 상세 경로 */
export function entryHref(e: Pick<Entry, "slug">): string {
  return `/posts/${e.slug}`;
}

/**
 * 목록에 쓸 대표 이미지.
 * 명시한 coverImage(노션 페이지 커버)가 우선, 없으면 본문 첫 이미지를 끌어올린다.
 * 목록에서 썸네일을 항상 노출하므로(ADR-0025) 여기가 비면 자리도 빈다.
 */
export function coverOf(e: Pick<Entry, "coverImage" | "body">): string | undefined {
  if (e.coverImage) return e.coverImage;
  const m = e.body?.match(/!\[[^\]]*\]\(([^)\s]+)/);
  return m?.[1];
}
