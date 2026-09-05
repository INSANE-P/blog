import { getList } from "@/features/posts/queries";
import { buildRss } from "@/lib/seo/feed";
import { entryHref } from "@/features/posts/types";
import { SITE } from "@/lib/site";

/**
 * RSS 피드 (ADR-0044).
 *
 * `/rss.xml` 로 연다 — 확장자가 붙어 있어야 사람이 주소만 보고 무엇인지 안다.
 * 안전망 주기의 근거는 홈 화면에 적어 두었다 (ADR-0045).
 */
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const entries = await getList();
  return new Response(buildRss({ entries, site: SITE, hrefOf: entryHref }), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
