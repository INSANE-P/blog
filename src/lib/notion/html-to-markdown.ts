/**
 * 노션이 내보내는 "Notion-flavored Markdown"을 우리가 렌더할 수 있는 순수 마크다운으로 되돌린다.
 *
 * 노션의 마크다운 엔드포인트는 표준 마크다운으로 표현할 수 없는 블록을 XML 같은 태그로 낸다.
 * 콜아웃은 `<callout>`, 토글은 `<details>/<summary>`, 컬럼은 `<columns>/<column>`,
 * 동영상·파일은 `<video src>`·`<file src>`, 북마크·임베드는 `<unknown url alt>` 같은 식이다.
 *
 * 렌더러는 원시 HTML을 실행하지 않는다(ADR-0012 — 텍스트를 escape 해 XSS로부터 안전하다).
 * 그래서 이 태그들이 그대로 넘어가면 화면에서 조용히 사라진다. 콜아웃 하나 썼다고
 * 그 문단이 통째로 없어지는데 아무도 모르는 상황이 실제로 가능했다.
 *
 * 그래서 두 가지를 지킨다.
 *
 *   1. 아는 태그는 뜻이 가장 가까운 마크다운으로 바꾼다
 *   2. 모르는 태그는 껍데기만 벗기고 안의 글자는 남긴 뒤, 어떤 태그였는지 보고한다
 *
 * 조용히 버리는 대신 시끄럽게 알리는 쪽을 고른 이유는, 노션이 블록을 새로 추가하면
 * 우리가 모르는 태그가 언젠가 반드시 나오기 때문이다. 그때 글이 깨진 채로 몇 달을 가는 것보다
 * 동기화가 "모르는 태그를 봤다"고 알려 주는 편이 낫다.
 *
 * 코드 블록과 인라인 코드 안은 건드리지 않는다 — 예제로 적어 둔 HTML이 변형되면 안 된다.
 */

export type MarkdownConversion = {
  markdown: string;
  /** 뜻을 아는 짝이 없어 껍데기만 벗긴 태그 이름들 (중복 제거) */
  unknownTags: string[];
};

/**
 * 코드를 잠시 빼 둘 때 쓰는 자리표.
 *
 * 사적 사용 영역(U+E000) 문자를 쓴다. "[[0]]" 이나 " 0 " 처럼 평범한 모양을 쓰면
 * 본문에 우연히 같은 것이 있을 때("값이 3 이다") 그 자리를 코드로 바꿔치기한다.
 * 이 영역의 문자는 사람이 쓴 글에 나오지 않는다.
 */
const MARK = String.fromCharCode(0xe000);

/** 셀 안의 마크다운 표를 깨뜨리는 문자만 최소한으로 처리한다 */
function cell(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

/** <table>…</table> 한 덩어리를 마크다운 표로 */
function tableToMarkdown(html: string): string {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) =>
    [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => cell(c[1])),
  );
  if (rows.length === 0) return "";

  // 노션은 header-row="true" 로 첫 행이 머리글인지 알려준다.
  // 머리글이 없으면 빈 머리글을 넣는다 — 마크다운 표는 구분선이 필수라
  // 이게 없으면 표로 렌더되지 않는다.
  const hasHeader = /header-row=["']true["']/i.test(html);
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...Array(width - r.length).fill("")];

  const head = hasHeader ? pad(rows[0]) : Array(width).fill("");
  const bodyRows = hasHeader ? rows.slice(1) : rows;

  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(Array(width).fill("---")), ...bodyRows.map((r) => line(pad(r)))].join(
    "\n",
  );
}

/** 속성 하나를 읽는다 — src="…" / url='…' 둘 다 */
function attr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"))?.[1];
}

/** 여러 줄을 통째로 인용문으로 만든다 */
function asBlockquote(inner: string): string {
  const text = inner.trim();
  if (!text) return "";
  const quoted = text
    .split("\n")
    .map((l) => `> ${l}`.trimEnd())
    .join("\n");
  return `\n\n${quoted}\n\n`;
}

/** 링크 한 줄. 제목이 없으면 주소를 제목으로 쓴다 */
function asLink(label: string, url?: string): string {
  const text = label
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!url) return text ? `\n\n${text}\n\n` : "";
  return `\n\n[${text || url}](${url})\n\n`;
}

/**
 * 우리가 직접 마크다운으로 바꾸는 태그들.
 * 여기에 없는 태그를 만나면 껍데기만 벗기고 이름을 보고한다.
 */
const HANDLED = new Set([
  "mark",
  "highlight",
  "span",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "br",
  "callout",
  "details",
  "summary",
  "columns",
  "column",
  "synced_block",
  "table_of_contents",
  "video",
  "audio",
  "pdf",
  "file",
  "page",
  "database",
  "unknown",
]);

export function htmlToMarkdown(md: string): MarkdownConversion {
  const unknown = new Set<string>();

  // 코드는 통째로 빼 두었다가 마지막에 되돌린다.
  const vault: string[] = [];
  const stash = (text: string) => MARK + (vault.push(text) - 1) + MARK;

  let work = md.replace(/```[\s\S]*?```/g, stash).replace(/`[^`\n]*`/g, stash);

  work = work
    /*
      형광펜 (ADR-0042).

      **노션은 `<span color="blue_bg">` 로 낸다.** 실물을 받아 확인했다.
      처음에는 `_background` 로 짐작해 두었다가 하나도 걸리지 않았고, 그때
      `span` 을 "다루는 태그" 목록에 넣어 둔 탓에 모르는 태그로 보고되지도 않았다 —
      **짐작으로 적은 값이 보고까지 막았다.**

      그래서 뒤가 `_bg` 든 `_background` 든 다 받는다. `<mark>` 와 `<highlight>` 도 함께 받는다 —
      노션이 표기를 바꿔도 한쪽은 걸리게 두는 편이 낫다.
      전부 `==글자==` 로 옮기고, 그 뒤는 remark-highlight 가 `<mark>` 로 되돌린다.

      글자색만 바꾼 것(`color="blue"`)은 형광펜이 아니다. 껍데기만 벗겨 글자를 남긴다.
      배경색 스팬에 `underline="true"` 같은 것이 함께 와도 형광펜으로 본다 —
      마크다운에 밑줄이 없고, 이 사이트의 밑줄은 다른 뜻으로 쓰고 있다(ADR-0030).
    */
    .replace(/<(?:mark|highlight)[^>]*>([\s\S]*?)<\/(?:mark|highlight)>/gi, (_m, inner: string) =>
      inner.trim() ? `==${inner.trim()}==` : "",
    )
    .replace(/<span([^>]*)>([\s\S]*?)<\/span>/gi, (whole: string, head: string, inner: string) => {
      const color = attr(head, "color") ?? "";
      const isHighlight = /_(bg|background)$/i.test(color) || /background/i.test(head);
      if (!isHighlight) return whole;
      return inner.trim() ? `==${inner.trim()}==` : "";
    })

    // 표 — 가장 먼저. 안쪽의 <br> 등은 셀 변환이 직접 처리한다
    .replace(/<table[\s\S]*?<\/table>/gi, (t) => `\n\n${tableToMarkdown(t)}\n\n`)

    // 콜아웃 → 인용문. 화면의 인용문이 옅은 면이라 콜아웃과 같은 생김새다
    .replace(/<callout([^>]*)>([\s\S]*?)<\/callout>/gi, (_m, head: string, inner: string) => {
      const icon = attr(head, "icon");
      return asBlockquote(icon ? `${icon} ${inner.trim()}` : inner);
    })

    // 토글 → 요약 줄을 굵게, 내용은 펼친 채로.
    // 접는 동작은 잃지만 글이 사라지는 것보다 낫고, 검색에도 잡힌다.
    .replace(/<details[^>]*>([\s\S]*?)<\/details>/gi, (_m, inner: string) => {
      const summary = inner.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ?? "";
      const rest = inner.replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "").trim();
      const title = summary.replace(/<[^>]+>/g, "").trim();
      return `\n\n${title ? `**${title}**\n\n` : ""}${rest}\n\n`;
    })

    // 컬럼·동기화 블록 → 껍데기만 벗긴다.
    // 읽는 칸이 한 줄뿐이라 나란한 배치는 어차피 세로로 쌓인다.
    .replace(/<\/?(?:columns|column|synced_block)[^>]*>/gi, "\n\n")

    // 노션 목차 → 없앤다. 목차는 우리가 h2 에서 직접 만든다(ADR-0027)
    .replace(/<table_of_contents\s*\/?>/gi, "")

    // 미디어·파일 → 링크.
    // 노션이 주는 주소는 서명이 붙어 만료되므로 언젠가 끊긴다. 그래도
    // "여기 무언가 있었다"는 사실은 남겨야 한다(ADR-0023 남는 문제).
    .replace(
      /<(video|audio|pdf|file)([^>]*)>([\s\S]*?)<\/\1>/gi,
      (_m, _tag: string, head: string, inner: string) => asLink(inner, attr(head, "src")),
    )
    .replace(/<(video|audio|pdf|file)([^>]*)\/>/gi, (_m, tag: string, head: string) =>
      asLink(attr(head, "alt") ?? tag, attr(head, "src")),
    )

    // 하위 페이지·데이터베이스 → 링크
    .replace(
      /<(page|database)([^>]*)>([\s\S]*?)<\/\1>/gi,
      (_m, _tag: string, head: string, inner: string) => asLink(inner, attr(head, "url")),
    )

    // 북마크·임베드·링크 미리보기 등 노션이 마크다운으로 못 내는 것들
    .replace(/<unknown([^>]*)\/?>/gi, (_m, head: string) =>
      asLink(attr(head, "alt") ?? "링크", attr(head, "url")),
    )

    // 문단 안 줄바꿈. 마크다운에서 줄바꿈은 "공백 두 개 + 개행"이다
    .replace(/<br\s*\/?>/gi, "  \n")

    // 남은 태그 — 껍데기만 벗기고 글자는 남긴다. 무엇이었는지는 보고한다.
    .replace(/<\/?([a-zA-Z0-9_-]+)[^>]*>/g, (_m, name: string) => {
      const tag = name.toLowerCase();
      if (!HANDLED.has(tag)) unknown.add(tag);
      return "";
    });

  // 코드를 되돌린다. 펜스 코드 안에 인라인 코드가 들어 있을 수 있어 자리표가 없어질 때까지 돈다.
  const holder = new RegExp(`${MARK}(\\d+)${MARK}`, "g");
  for (let i = 0; i < 5 && work.includes(MARK); i += 1) {
    work = work.replace(holder, (_m, n: string) => vault[Number(n)] ?? "");
  }

  // 줄 끝 공백은 손대지 않는다 — 마크다운에서 공백 두 개는 줄바꿈이다
  const markdown = work.replace(/\n{3,}/g, "\n\n").trim();

  return { markdown, unknownTags: [...unknown] };
}
