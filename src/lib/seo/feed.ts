/**
 * RSS 를 만드는 순수 함수 (ADR-0044).
 *
 * **import 가 하나도 없다.** 일부러 그렇게 뒀다.
 * `pnpm check:seo` 가 이 파일을 그냥 node 로 불러 픽스처를 돌리는데,
 * `@/` 별칭은 Next 빌드가 푸는 것이라 node 는 읽지 못한다.
 * 필요한 것(사이트 정보, 주소 만드는 법)은 인자로 받는다.
 *
 * 인자로 받게 하니 설계도 나아졌다. 이 함수는 "글 목록을 XML 로 바꾼다"만 하고,
 * 우리 사이트가 무엇인지는 부르는 쪽이 안다.
 *
 * 사이트맵·피드는 사람이 잘 열어 보지 않는 파일이라 깨져도 한참 모른다.
 * 그래서 눈이 아니라 검사가 지킨다.
 */

export type FeedEntry = {
  slug: string;
  title: string;
  excerpt: string;
  /** "YYYY-MM-DD" */
  date: string;
  publishedAt?: string;
  updatedAt?: string;
};

export type FeedSite = {
  url: string;
  name: string;
  description: string;
  lang: string;
};

/** XML 에 그대로 넣으면 안 되는 다섯 글자 */
export function xmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * 글의 마지막 변경 시각.
 *
 * `updatedAt` 은 내용이 실제로 바뀔 때만 움직인다 — 동기화가 안 바뀐 글은 아예 쓰지 않는다.
 * 그것이 없으면 발행 시각, 그것도 없으면 글에 적힌 날짜로 물러난다.
 * 셋 다 읽을 수 없으면 지금으로 둔다. 사이트맵에 `Invalid Date` 가 나가는 것보다 낫다.
 */
export function lastModifiedOf(entry: FeedEntry): Date {
  const iso = entry.updatedAt ?? entry.publishedAt ?? (entry.date ? `${entry.date}T00:00:00Z` : "");
  const d = iso ? new Date(iso) : new Date(NaN);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/**
 * RSS 2.0 피드.
 *
 * 본문 전체가 아니라 요약만 싣는다. 마크다운 원문을 그대로 흘리면 리더마다 다르게 깨지고,
 * HTML 로 바꿔 넣으려면 렌더 경로를 하나 더 만들어야 한다. 요약은 어디서든 같게 보인다.
 */
export function buildRss({
  entries,
  site,
  hrefOf,
  now = new Date(),
}: {
  entries: FeedEntry[];
  site: FeedSite;
  /** 글 하나의 사이트 안 경로 — 부르는 쪽의 규칙을 그대로 쓴다 */
  hrefOf: (entry: FeedEntry) => string;
  now?: Date;
}): string {
  const abs = (path: string) => `${site.url}${path.startsWith("/") ? path : `/${path}`}`;

  const items = entries
    .map((e) => {
      const url = abs(hrefOf(e));
      return [
        "    <item>",
        `      <title>${xmlEscape(e.title)}</title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        `      <pubDate>${lastModifiedOf(e).toUTCString()}</pubDate>`,
        e.excerpt ? `      <description>${xmlEscape(e.excerpt)}</description>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xmlEscape(site.name)}</title>`,
    `    <link>${xmlEscape(site.url)}</link>`,
    `    <description>${xmlEscape(site.description)}</description>`,
    `    <language>${site.lang}</language>`,
    `    <lastBuildDate>${now.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${xmlEscape(abs("/rss.xml"))}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
