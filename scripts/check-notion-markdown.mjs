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
import { youTubeId } from "../src/lib/content/youtube-id.ts";
import { youTubeLinksIn, withYouTubeTitles } from "../src/lib/notion/youtube-titles.ts";

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
<file src="file://%7B%22source%22%3A%22attachment%3Aabc%3A%EA%B3%84%ED%9A%8D%EC%84%9C.pdf%22%7D"></file>
<unknown url="https://app.notion.com/p/aaaa#bbbb" alt="bookmark"/>
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
  ["하위 페이지는 이름만 남는다", "하위 페이지"],
  ["올린 파일은 이름만 남는다", "계획서.pdf"],
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
  ["노션 안쪽 주소는 링크로 내보내지 않는다", "notion.so/child"],
  ["노션 앱 주소도 마찬가지", "app.notion.com"],
  ["올린 파일의 내부 참조", "file://"],
  ["블록 종류 이름은 글자로도 안 남긴다", "bookmark"],
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

console.log("\n── 블록 사이 빈 줄 (ADR-0063) ──");
/*
  실제 노션 출력은 블록 사이에 빈 줄이 없다. 위의 예시는 빈 줄이 다 들어 있는 모양이라
  이 차이를 잡지 못했고, 그 사이 발행한 글의 문단이 전부 한 문단으로 붙어 있었다.
  그래서 실물과 같은 모양을 따로 넣는다.
*/
const TAB = String.fromCharCode(9);
const NL = String.fromCharCode(10);
const FENCE = "`".repeat(3);
const REAL = [
  "## 첫 절",
  "문단 하나.",
  "문단 둘.",
  "- 항목 하나",
  "- 항목 둘",
  "목록 뒤 문단.",
  "1. 따라 하기 첫째",
  TAB + "![그림](https://example.com/a.png)",
  TAB + "들여쓴 설명 문단.",
  "2. 따라 하기 둘째",
  '<table header-row="true">',
  "<tr><td>칸</td><td>값</td></tr>",
  "<tr><td>가</td><td>1</td></tr>",
  "</table>",
  "줄바꿈이 있는 문단<br>둘째 줄",
  "> 인용 한 줄",
  FENCE,
  "x = 1",
  "y = 2",
  FENCE,
  "<details>",
  "<summary>토글</summary>",
  TAB + "토글 안 문단.",
  "</details>",
  "마지막 문단.",
  "---",
  "끝맺음.",
].join(NL);
const real = htmlToMarkdown(REAL).markdown;
const lines = (...xs) => xs.join(NL);
const BLOCK = [
  ["문단끼리 빈 줄로 나뉜다", lines("문단 하나.", "", "문단 둘.")],
  ["구분선 위 문단이 제목이 되지 않는다", lines("마지막 문단.", "", "---")],
  ["목록 항목끼리는 붙어 있다", lines("- 항목 하나", "- 항목 둘")],
  ["목록 뒤 문단이 마지막 항목에 붙지 않는다", lines("- 항목 둘", "", "목록 뒤 문단.")],
  ["항목 아래 그림은 들여쓴 채 남는다", TAB + "![그림](https://example.com/a.png)"],
  ["표 줄은 붙어 있다", lines("| 칸 | 값 |", "| --- | --- |", "| 가 | 1 |")],
  ["br 로 이은 줄은 한 문단이다", lines("줄바꿈이 있는 문단  ", "둘째 줄")],
  ["코드 안은 그대로다", lines(FENCE, "x = 1", "y = 2", FENCE)],
];
for (const [name, needle] of BLOCK) {
  const ok = real.includes(needle);
  if (!ok) failed += 1;
  console.log(`${ok ? "OK  " : "FAIL"} ${name}`);
}
// 목록 밖 들여쓴 줄은 코드 블록이 되면 안 된다
const indentedCode = real.split(NL).some((l, i, a) => /^(\t| {4})토글 안 문단/.test(l) && a[i - 1] === "");
if (indentedCode) failed += 1;
console.log(`${indentedCode ? "FAIL" : "OK  "} 토글 안 문단이 코드 블록이 되지 않는다`);

console.log("\n── 노션이 이스케이프하지 않는 본문 글자 (ADR-0064) ──");
/*
  노션은 물결표만 이스케이프한다. 나머지 글자는 그대로 와서 렌더러가 다른 뜻으로 읽는다.
  기대값은 렌더러가 글자로 읽게 바뀐 모양이다.
*/
const ESC = String.fromCharCode(92);
const PROSE = [
  ["주소 뒤 한글 조사가 링크에 붙지 않는다", "자세한 건 https://example.com에서 본다.", "<https://example.com>에서"],
  ["링크 안의 주소는 건드리지 않는다", "[문서](https://example.com)에서 본다.", "[문서](https://example.com)에서"],
  ["본문의 꺾쇠 글자가 지워지지 않는다", "타입은 Array<string> 으로 받는다.", "Array" + ESC + "<string>"],
  ["숫자 앞 달러는 수식이 되지 않는다", "요금은 $5에서 $10으로 올랐다.", ESC + "$5에서 " + ESC + "$10"],
  ["노션 수식 모양은 그대로 둔다", "넓이는 $x^2$ 이다.", "$x^2$"],
  ["1) 로 시작하는 줄은 목록이 아니다", "1) 첫째 이유는 비용이다.", "1" + ESC + ") 첫째"],
  ["연도로 시작하는 줄은 목록이 아니다", "2026. 10. 20 에 바꿨다.", "2026" + ESC + ". 10. 20"],
  ["진짜 번호 목록은 그대로다", "1. 첫째 단계", "1. 첫째 단계"],
];
for (const [name, input, want] of PROSE) {
  const got = htmlToMarkdown(input).markdown;
  const ok = got.includes(want);
  if (!ok) failed += 1;
  console.log(`${ok ? "OK  " : "FAIL"} ${name}`);
  if (!ok) console.log(`     받음: ${got}`);
}

console.log("\n── 유튜브 주소 읽기 ──");
const YT = [
  ["주소창 모양", "https://www.youtube.com/watch?v=amy704I2PxQ", "amy704I2PxQ"],
  ["공유 단추 모양", "https://youtu.be/amy704I2PxQ", "amy704I2PxQ"],
  ["임베드 모양", "https://www.youtube.com/embed/amy704I2PxQ", "amy704I2PxQ"],
  ["쇼츠", "https://www.youtube.com/shorts/amy704I2PxQ", "amy704I2PxQ"],
  ["다른 값이 붙어 있어도", "https://www.youtube.com/watch?v=amy704I2PxQ&t=30s", "amy704I2PxQ"],
  ["유튜브가 아니면", "https://vimeo.com/12345", undefined],
  ["주소가 아니면", "그냥 글자", undefined],
  ["노션 내부 참조", "file://%7B%22source%22%3A%22x%22%7D", undefined],
];
for (const [name, url, want] of YT) {
  const got = youTubeId(url);
  const ok = got === want;
  if (!ok) failed += 1;
  console.log(`${ok ? "OK  " : "FAIL"} ${name}`);
}

console.log("");
console.log("── 유튜브 제목 박기 ──");
// 소스에 역슬래시를 쓰지 않으려고 한 번만 만들어 둔다
const BS = String.fromCharCode(92);
const V = "https://www.youtube.com/watch?v=amy704I2PxQ";
const INFO = new Map([
  ["amy704I2PxQ", { title: "미야기의 캡틴은 고개 숙이지 않는다", channel: "동수칸TV" }],
]);
const titled = (md, info = INFO) => withYouTubeTitles(md, info, youTubeId);

const TITLE = [
  [
    "노션이 준 video 를 진짜 제목으로 바꾼다",
    titled("[video](" + V + ")"),
    "[미야기의 캡틴은 고개 숙이지 않는다](" + V + ' "동수칸TV")',
  ],
  [
    "이미 제목이 붙어 있으면 다시 묻지 않는다",
    titled("[예전 제목](" + V + ' "예전 채널")'),
    "[예전 제목](" + V + ' "예전 채널")',
  ],
  [
    "받아오지 못한 영상은 그대로 둔다",
    titled("[video](" + V + ")", new Map()),
    "[video](" + V + ")",
  ],
  [
    "유튜브가 아닌 링크는 건드리지 않는다",
    titled("[문서](https://example.com/a)"),
    "[문서](https://example.com/a)",
  ],
  [
    "제목의 대괄호가 링크를 깨뜨리지 않게 막는다",
    titled(
      "[video](" + V + ")",
      new Map([["amy704I2PxQ", { title: "[속보] 어쩌고", channel: "" }]]),
    ),
    "[" + BS + "[속보" + BS + "] 어쩌고](" + V + ")",
  ],
  [
    "채널 이름의 큰따옴표도 막는다",
    titled("[video](" + V + ")", new Map([["amy704I2PxQ", { title: "제목", channel: '가"나' }]])),
    "[제목](" + V + ' "가' + BS + '"나")',
  ],
];
for (const [name, got, want] of TITLE) {
  if (got === want) {
    console.log("OK   " + name);
  } else {
    failed += 1;
    console.log("FAIL " + name);
    console.log("     받음: " + got);
    console.log("     기대: " + want);
  }
}

// 링크를 고르는 쪽도 따로 본다 — 이미 제목이 붙은 것은 후보에서 빠져야 한다
const cands = youTubeLinksIn("[video](" + V + ")  [이미 제목](" + V + ' "채널")', youTubeId);
if (cands.length === 1) {
  console.log("OK   이미 제목이 붙은 링크는 후보에서 뺀다");
} else {
  console.log("FAIL 다시 물어야 할 링크만 골라내지 못했다 — " + cands.length + "개");
  failed += 1;
}

console.log(`\n실패: ${failed}건`);
process.exit(failed ? 1 : 0);
