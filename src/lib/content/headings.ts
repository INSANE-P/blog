/**
 * 본문 마크다운에서 목차와 읽는 시간을 뽑는다 (ADR-0027).
 *
 * 렌더된 DOM을 훑지 않고 원문에서 뽑는 이유는, 서버에서 목차를 만들어 내려보내야
 * 자바스크립트가 늦게 와도 목차가 보이고 검색엔진에도 잡히기 때문이다.
 */

/** 코드 블록 안의 `## ` 을 제목으로 잘못 읽지 않도록 펜스 구간을 먼저 지운다 */
function stripFences(md: string): string {
  return md.replace(/^```[\s\S]*?^```/gm, "");
}

/**
 * 제목 문자열 → 앵커 id.
 * 한글을 그대로 두면 주소창에서 %EA%B0%99은 식으로 길어지므로 공백만 하이픈으로 바꾸고
 * 링크로 쓸 수 없는 문자를 턴다. 같은 제목이 여러 번 나오면 뒤에 번호를 붙인다.
 */
export function slugify(text: string, seen?: Map<string, number>): string {
  const base =
    text
      .trim()
      .toLowerCase()
      .replace(/[`*_[\]()#]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\p{Letter}\p{Number}-]/gu, "") || "section";
  if (!seen) return base;
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n === 0 ? base : `${base}-${n}`;
}

export type Heading = { id: string; text: string };

/** h2 만 모은다. h3 까지 넣으면 목차가 본문만큼 길어져 훑는 도구가 아니게 된다. */
export function extractHeadings(md: string): Heading[] {
  const seen = new Map<string, number>();
  const out: Heading[] = [];
  for (const m of stripFences(md).matchAll(/^##\s+(.+?)\s*#*\s*$/gm)) {
    const text = m[1].replace(/[*_`]/g, "").trim();
    if (text) out.push({ id: slugify(text, seen), text });
  }
  return out;
}

/**
 * 읽는 시간(분).
 *
 * 영어 기준의 분당 단어 수를 쓰면 한글 글이 실제보다 훨씬 길게 나온다.
 * 한글은 글자 하나가 담는 정보가 많아 분당 500자 정도로 잡는 것이 실제 체감에 가깝다.
 * 코드 블록은 눈으로 훑는 속도가 달라 글자 수에서 뺀다.
 */
export function readingMinutes(md: string): number {
  const text = stripFences(md).replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  return Math.max(1, Math.round(text.replace(/\s/g, "").length / 500));
}
