/**
 * 노션 마크다운 API가 일부 요소를 HTML로 내보내는 것을 마크다운으로 되돌린다.
 *
 * 왜 렌더러에서 HTML을 허용하지 않고 여기서 바꾸는가:
 * 본문에 HTML 실행을 허용하면 "텍스트를 escape 해 XSS로부터 안전하다"는
 * ADR-0012의 전제가 무너진다. 변환 대상이 <table>·<br> 둘뿐이라 범위가 좁아,
 * 안전 전제를 지키는 쪽이 싸다.
 *
 * 노션이 마크다운 표를 직접 내보내게 되면 이 파일은 통째로 사라진다.
 */

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
  return [
    line(head),
    line(Array(width).fill("---")),
    ...bodyRows.map((r) => line(pad(r))),
  ].join("\n");
}

/**
 * 마크다운 안에 섞인 HTML을 정리한다.
 * 코드 블록(``` … ```) 안의 내용은 건드리지 않는다 — 예제 HTML이 변형되면 안 된다.
 */
export function htmlToMarkdown(md: string): string {
  const parts = md.split(/(```[\s\S]*?```)/g);

  return parts
    .map((part) => {
      if (part.startsWith("```")) return part; // 코드 블록은 그대로

      return part
        // 표
        .replace(/<table[\s\S]*?<\/table>/gi, (t) => `\n\n${tableToMarkdown(t)}\n\n`)
        // 문단 안 줄바꿈. 마크다운에서 줄바꿈은 "공백 두 개 + 개행"이다
        .replace(/<br\s*\/?>/gi, "  \n");
    })
    .join("")
    // 변환 과정에서 생긴 과한 빈 줄 정리
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
