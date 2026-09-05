import { getList } from "@/features/posts/queries";
import { buildRss } from "@/lib/seo/feed";
import { entryHref } from "@/features/posts/types";
import { SITE } from "@/lib/site";

/**
 * RSS 피드 (ADR-0044).
 *
 * `/rss.xml` 로 연다 — 확장자가 붙어 있어야 사람이 주소만 보고 무엇인지 안다.
 * 한 시간 캐시한다. 글은 하루에 몇 번 바뀌지 않는데 리더는 자주 두드린다.
 */
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const entries = await getList();
  return new Response(buildRss({ entries, site: SITE, hrefOf: entryHref }), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
