/**
 * 검색 노출 표시 검사 (ADR-0044).
 *
 * 사이트맵·RSS·구조화 데이터는 사람이 잘 열어 보지 않는 파일이라, 깨져도 한참 모른다.
 * 그래서 만드는 함수를 순수 함수로 빼 두고 여기서 픽스처로 돌린다.
 * DB 도 네트워크도 필요 없다.
 *
 * 실행: pnpm check:seo
 */
import { buildRss, lastModifiedOf, publishedAtOf, xmlEscape } from "../src/lib/seo/feed.ts";

const SITE = {
  url: "https://example.test",
  name: "박찬빈",
  description: "도전하고, 그 과정을 기록합니다.",
  lang: "ko",
};
const hrefOf = (e) => `/posts/${e.slug}`;

const ENTRIES = [
  {
    slug: "hello",
    title: '따옴표 "와" <꺾쇠> & 앰퍼샌드가 든 제목',
    excerpt: "요약에도 <태그> 가 들어올 수 있다",
    date: "2026-09-03",
    publishedAt: "2026-09-03T04:00:00.000Z",
    updatedAt: "2026-09-05T01:00:00.000Z",
    tags: ["회고"],
  },
  {
    slug: "no-times",
    title: "시각이 없는 글",
    excerpt: "",
    date: "2026-01-02",
  },
];

let failed = 0;
const check = (name, ok) => {
  if (!ok) failed += 1;
  console.log(`${ok ? "OK  " : "FAIL"} ${name}`);
};

const rss = buildRss({
  entries: ENTRIES,
  site: SITE,
  hrefOf,
  now: new Date("2026-09-05T02:00:00.000Z"),
});

console.log("── RSS ──");
check("XML 선언으로 시작", rss.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
check("채널 자기 링크(atom:link)", rss.includes('rel="self"'));
check("글 수만큼 item", (rss.match(/<item>/g) ?? []).length === ENTRIES.length);
check("절대 주소 링크", rss.includes("<link>https://"));
check("guid 가 링크와 같다", rss.includes('<guid isPermaLink="true">https://'));
check("발행 시각은 RFC822", /<pubDate>\w{3}, \d{2} \w{3} \d{4}/.test(rss));
check(
  "요약이 없으면 description 을 만들지 않는다",
  (rss.match(/<description>/g) ?? []).length === 2,
);

console.log("\n── XML 이스케이프 ──");
/*
  이스케이프된 결과에는 `&` 가 당연히 남는다 — `&quot;` 의 첫 글자다.
  그래서 "앰퍼샌드가 없다"가 아니라 "모든 앰퍼샌드가 엔티티의 시작이다"를 봐야 한다.
  처음에 그렇게 적었다가 검사가 스스로 틀렸다.
*/
const itemTitle = rss.match(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
check("꺾쇠가 그대로 남지 않는다", !/[<>]/.test(itemTitle));
check("따옴표가 엔티티로 바뀐다", itemTitle.includes("&quot;"));
check("모든 앰퍼샌드가 엔티티의 시작이다", !/&(?!amp;|lt;|gt;|quot;|apos;)/.test(itemTitle));
check("앰퍼샌드", xmlEscape("a & b") === "a &amp; b");
check("여는 꺾쇠", xmlEscape("<script>") === "&lt;script&gt;");
check("이미 이스케이프된 것을 두 번 하지 않는 실수 방지", xmlEscape("&amp;") === "&amp;amp;");

console.log("\n── 발행 시각 ──");
check(
  "화면에 보이는 날짜(entry_date)를 그대로 쓴다",
  publishedAtOf(ENTRIES[0]).toISOString() === "2026-09-03T00:00:00.000Z",
);
check(
  "published_at 이 화면 날짜와 달라도 화면 날짜가 이긴다",
  publishedAtOf({ ...ENTRIES[0], publishedAt: "2026-12-25T00:00:00.000Z" }).toISOString() ===
    "2026-09-03T00:00:00.000Z",
);

console.log("\n── 마지막 변경 시각 ──");
check(
  "updatedAt 이 있으면 그것",
  lastModifiedOf(ENTRIES[0]).toISOString() === "2026-09-05T01:00:00.000Z",
);
check(
  "없으면 글 날짜로 물러난다",
  lastModifiedOf(ENTRIES[1]).toISOString() === "2026-01-02T00:00:00.000Z",
);
check(
  "발행보다 앞선 수정 시각은 발행 시각으로 끌어올린다",
  lastModifiedOf({ ...ENTRIES[0], updatedAt: "2020-01-01T00:00:00.000Z" }).toISOString() ===
    "2026-09-03T00:00:00.000Z",
);
check(
  "망가진 값이면 지금으로",
  !Number.isNaN(
    lastModifiedOf({ slug: "x", title: "x", excerpt: "", date: "말도 안 되는 날짜" }).getTime(),
  ),
);

console.log(`\n실패: ${failed}건`);
process.exit(failed > 0 ? 1 : 0);
