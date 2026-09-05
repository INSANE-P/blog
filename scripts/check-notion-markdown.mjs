/**
 * 노션 문법 손실 검사.
 *
 * 노션의 마크다운 엔드포인트는 표준 마크다운으로 표현할 수 없는 블록을 XML 같은 태그로 낸다.
 * 렌더러는 원시 HTML을 실행하지 않으므로(ADR-0012), 변환기가 놓친 태그의 내용은
 * 화면에서 조용히 사라진다. 실제로 콜아웃을 쓴 글의 문단이 통째로 없어지고 있었다.
 *
 * 그래서 "노션이 낼 법한 모든 것"을 한 덩어리로 넣고, 사라지면 안 되는 글자가
 * 변환 결과에 남아 있는지 본다. 눈으로 확인하는 검사는 언젠가 건너뛰게 된다.
 *
 * 실행: pnpm check:notion
 */
import { htmlToMarkdown } from "../src/lib/notion/html-to-markdown.ts";

const NOTION_RAW = `# 문서 제목

일반 문단. **굵게**, *기울임*, ~~취소선~~, \`인라인 코드\`, [링크](https://example.com).
숫자도 있다 — 값이 3 이다.

- 첫 항목
  - 중첩 항목
- [ ] 아직 안 한 일
- [x] 끝낸 일

> 노션의 인용문.

<callout icon="💡">
콜아웃 내용이다.
</callout>

형광펜은 여러 모양으로 온다 — <mark>마크 강조</mark>, <span color="blue_bg">스팬 강조</span>, <span color="yellow_background">옛 표기 강조</span>, <span color="blue_bg" underline="true">속성이 더 붙은 강조</span>, <highlight>하이라이트 강조</highlight>.
글자색만 바꾼 <span color="blue">파란 글자</span>는 형광펜이 아니라 그냥 글자다.

<details>
<summary>토글 제목</summary>

토글 안의 내용.

</details>

<columns><column>왼쪽 칸 내용</column><column>오른쪽 칸 내용</column></columns>

<synced_block>동기화 블록 내용</synced_block>

<table header-row="true">
<tr><th>항목</th><th>값</th></tr>
<tr><td>전송량</td><td>월 2GB<br>초과 시 차단</td></tr>
</table>

<video src="https://example.com/clip.mp4">데모 영상</video>
<file src="https://example.com/doc.pdf">설계 문서</file>
<page url="https://notion.so/child">하위 페이지</page>
<unknown url="https://github.com/INSANE-P" alt="북마크" />

날짜 멘션은 속성에만 값이 있다 — <mention-date start="2026-09-05"/> 그리고 기간은 <mention-date start="2026-10-01" end="2026-10-05"/>.
아이콘이 내용으로 오는 콜아웃도 본다.
<callout color="blue_bg">
🍏 아이콘이 내용으로 온 콜아웃
</callout>
빈 콜아웃은 찌꺼기를 남기면 안 된다.
<callout color="blue_bg">
<empty-block/>
</callout>

주소 속성 이름이 바뀌어도 버티는지 — <video url="https://example.com/other.mp4">다른 이름의 영상</video>, <page href="https://notion.so/other">다른 이름의 하위 페이지</page>.
주소가 아예 없으면 보고해야 한다 — <video>주소 없는 영상</video>.
<table_of_contents />

<mystery-block foo="bar">노션이 나중에 추가한 모르는 블록의 글자.</mystery-block>

본문에 예제로 적은 \`<div class="x">\` 는 벗겨지면 안 된다.

\`\`\`html
<section>펜스 코드 안의 태그도 그대로여야 한다</section>
\`\`\`
`;

/** 변환 뒤에도 반드시 남아 있어야 하는 것들 */
const MUST_KEEP = [
  ["콜아웃 내용", "콜아웃 내용이다"],
  ["형광펜(mark 태그)", "==마크 강조=="],
  ["형광펜(배경색 스팬 _bg — 노션 실물)", "==스팬 강조=="],
  ["형광펜(옛 표기 _background)", "==옛 표기 강조=="],
  ["형광펜(속성이 더 붙어도)", "==속성이 더 붙은 강조=="],
  ["형광펜(highlight 태그)", "==하이라이트 강조=="],
  ["글자색만 바꾼 것은 그대로 둔다", "파란 글자"],
  ["콜아웃 아이콘(속성)", "💡"],
  ["콜아웃 아이콘(내용)", "🍏"],
  ["날짜 멘션", "2026-09-05"],
  ["기간 멘션", "2026-10-01 ~ 2026-10-05"],
  ["토글 제목", "토글 제목"],
  ["토글 내용", "토글 안의 내용"],
  ["컬럼 내용(왼쪽)", "왼쪽 칸 내용"],
  ["컬럼 내용(오른쪽)", "오른쪽 칸 내용"],
  ["동기화 블록 내용", "동기화 블록 내용"],
  ["표 머리글", "항목"],
  ["표 셀 안 줄바꿈", "초과 시 차단"],
  ["동영상 링크", "[데모 영상](https://example.com/clip.mp4)"],
  ["파일 링크", "[설계 문서](https://example.com/doc.pdf)"],
  ["하위 페이지 링크", "[하위 페이지](https://notion.so/child)"],
  ["북마크 링크", "[북마크](https://github.com/INSANE-P)"],
  ["모르는 블록의 글자", "모르는 블록의 글자"],
  ["인라인 코드 속 태그", '`<div class="x">`'],
  ["펜스 코드 속 태그", "<section>펜스 코드 안의 태그도"],
  ["자리표와 헷갈릴 문장", "값이 3 이다"],
  ["체크박스(미완료)", "- [ ] 아직 안 한 일"],
  ["체크박스(완료)", "- [x] 끝낸 일"],
];

/** 변환 뒤에 남아 있으면 안 되는 것들 — 남으면 화면에서 사라진다 */
const MUST_DROP = [
  ["콜아웃 태그", "<callout"],
  ["토글 태그", "<details"],
  ["컬럼 태그", "<columns"],
  ["노션 목차", "<table_of_contents"],
  ["표 태그", "<table"],
  ["형광펜 태그", "<mark"],
  ["배경색 스팬 태그", "<span"],
  ["날짜 멘션 태그", "<mention-date"],
  ["빈 블록 태그", "<empty-block"],
  ["모르는 블록 태그", "<mystery-block"],
];

const { markdown, unknownTags } = htmlToMarkdown(NOTION_RAW);

let failed = 0;
console.log("── 남아야 하는 것 ──");
for (const [name, needle] of MUST_KEEP) {
  const ok = markdown.includes(needle);
  if (!ok) failed += 1;
  console.log(`${ok ? "OK  " : "LOST"} ${name}`);
}

console.log("\n── 사라져야 하는 태그 ──");
for (const [name, needle] of MUST_DROP) {
  // 코드 블록 안에 예제로 있는 것은 세지 않는다
  const outsideCode = markdown.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  const ok = !outsideCode.includes(needle);
  if (!ok) failed += 1;
  console.log(`${ok ? "OK  " : "남음"} ${name}`);
}

console.log(`\n모르는 태그로 보고된 것: ${unknownTags.join(", ") || "(없음)"}`);

console.log("\n── 다루기로 해 놓고 못 다룬 것 보고 ──");
/*
  다루기로 해 놓은 태그인데 값을 못 찾은 경우도 알려야 한다.
  형광펜을 잃었을 때 가장 나빴던 것은 잃었다는 사실조차 몰랐던 것이다 —
  `HANDLED` 에 넣으면 보고에서 빠지므로, 다루는 방법이 틀리면 조용히 사라진다.
*/
console.log("\n── 찌꺼기 ──");
if (/^>\s*$/m.test(markdown)) {
  console.log("FAIL 빈 인용문이 남았다 — 내용 없는 콜아웃이 찌꺼기를 만든다");
  failed += 1;
} else {
  console.log("OK   빈 인용문을 남기지 않는다");
}

if (!unknownTags.some((t) => t.includes("주소 없음"))) {
  console.log("FAIL 주소를 못 찾은 태그를 보고하지 않았다 — 조용히 링크를 잃는 상태다");
  failed += 1;
} else {
  console.log("OK   주소를 못 찾은 태그를 보고한다");
}

if (!unknownTags.includes("mystery-block")) {
  console.log("FAIL 모르는 태그를 보고하지 않았다 — 조용히 버리는 상태로 되돌아갔다");
  failed += 1;
}

console.log(`\n실패: ${failed}건`);
process.exit(failed ? 1 : 0);
