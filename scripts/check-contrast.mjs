/**
 * 토큰 색 대비 검사.
 *
 * tokens.css 를 직접 읽어 계산한다. 값을 손으로 옮겨 적으면 나중에 토큰만 바꾸고
 * 검사는 그대로 남아 "통과했다고 적혀 있는데 실제로는 아닌" 상태가 된다.
 *
 * 기준(WCAG 2.1 1.4.3 / 1.4.11)
 *   본문·작은 글자 4.5:1 · 큰 글자(18.66px 이상 굵게, 24px 이상) 3:1 · UI 경계 3:1
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(REPO, rel), "utf8");
const css = read("src/styles/tokens.css");

function varsIn(source, selector) {
  const i = source.indexOf(selector);
  if (i < 0) return {};
  const body = source.slice(source.indexOf("{", i) + 1, source.indexOf("}", i));
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();

  /*
    토큰이 다른 토큰을 가리키는 경우를 푼다 — `--mark-fg: var(--prose-fg)` 처럼.
    값을 손으로 옮겨 적지 않으려고 둔 참조이므로, 검사기가 따라가 준다.
    같은 블록 안에서만 찾는다. 다크가 라이트를 가리키는 일은 없다.
  */
  for (let round = 0; round < 5; round += 1) {
    let changed = false;
    for (const [key, value] of Object.entries(out)) {
      const ref = value.match(/^var\((--[\w-]+)\)$/);
      if (ref && out[ref[1]]) {
        out[key] = out[ref[1]];
        changed = true;
      }
    }
    if (!changed) break;
  }
  return out;
}

const vars = (selector) => varsIn(css, selector);

const parse = (c) => {
  const hex = c.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgba = c.match(/rgba?\(([^)]+)\)/i);
  if (rgba) {
    const p = rgba[1].split(",").map((x) => parseFloat(x));
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  throw new Error(`알 수 없는 색: ${c}`);
};

/** 반투명 색을 배경 위에 얹은 실제 색 */
const over = (fg, bg) => {
  const [r, g, b, a] = fg;
  return [r * a + bg[0] * (1 - a), g * a + bg[1] * (1 - a), b * a + bg[2] * (1 - a), 1];
};

const lum = ([r, g, b]) => {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const CASES = [
  ["제목·UI 글자", "--foreground", "--background", 4.5],
  ["본문 글자", "--prose-fg", "--background", 4.5],
  ["보조 글자(날짜·설명)", "--muted", "--background", 4.5],
  ["악센트 글자(링크)", "--accent-text", "--background", 4.5],
  ["악센트 글자 위 틴트(태그 칩)", "--accent-text", "--tint", 4.5],
  ["형광펜 위 글자(두 테마 같은 잉크)", "--mark-fg", "--mark", 4.5],
  ["브랜드 색(로고 점·진행 바 — 그림 요소)", "--accent", "--background", 3],
  ["체크박스 테두리(UI 경계)", "--muted", "--background", 3],
  ["보조 글자 위 옅은 면(목차·푸터)", "--muted", "--surface-hover", 4.5],
  ["보조 글자 위 코드 머리줄", "--muted", "--code-bar", 4.5],
  ["본문 글자 위 코드 배경", "--prose-fg", "--code-bg", 4.5],
];

let failed = 0;
for (const mode of ["라이트", "다크"]) {
  /*
    다크는 라이트를 **물려받는다.** `.dark` 는 달라져야 하는 토큰만 다시 적으므로,
    거기 없는 값은 `:root` 것이 그대로 쓰인다(형광펜 잉크가 그렇다).
    두 블록을 따로 읽으면 검사기가 "다크에 그 토큰이 없다"고 착각한다.
  */
  const t = mode === "라이트" ? vars(":root {") : { ...vars(":root {"), ...vars(".dark {") };
  const bg = parse(t["--background"]);
  console.log(`\n── ${mode} ──`);
  for (const [name, fgKey, bgKey, min] of CASES) {
    const base = bgKey === "--background" ? bg : over(parse(t[bgKey]), bg);
    const fg = over(parse(t[fgKey]), base);
    const r = ratio(fg, base);
    const ok = r >= min;
    if (!ok) failed += 1;
    console.log(`${ok ? "OK  " : "FAIL"} ${r.toFixed(2).padStart(6)}:1  (기준 ${min}) ${name}`);
  }
}
/*
  giscus 테마 (ADR-0056).

  댓글창은 iframe 안이라 우리 CSS 가 닿지 않는다. 색을 변수로 넘겨 줄 뿐이고,
  그 값은 토큰에서 손으로 옮겨 적은 것이라 토큰을 고쳐도 따라오지 않는다.
  그래서 여기도 같은 자로 잰다 - 화면만 통과하고 댓글창을 놓치면
  "검사는 통과했는데 실제로 읽기 힘든 자리가 남아 있는" 상태가 된다.
*/
const GISCUS_CASES = [
  ["댓글 본문", "--color-fg-default", "--color-canvas-default", 4.5],
  ["이름·시각 같은 보조 글자", "--color-fg-muted", "--color-canvas-default", 4.5],
  ["보조 글자 위 옅은 면", "--color-fg-muted", "--color-canvas-subtle", 4.5],
  ["링크", "--color-accent-fg", "--color-canvas-default", 4.5],
  ["기본 단추 글자", "--color-btn-text", "--color-btn-bg", 4.5],
  ["주 단추 글자(댓글 등록)", "--color-btn-primary-text", "--color-btn-primary-bg", 4.5],
  /*
    경계선은 두 갈래다.

    **컨트롤의 경계**는 그것이 사라지면 어디에 적는지, 무엇을 누르는지를 알 수 없다.
    WCAG 1.4.11 이 3:1 을 요구하는 것이 이쪽이다.

    **분리선**(`--color-border-default`·`--color-border-muted`)은 다르다.
    댓글 사이의 선이 흐려도 무엇이 무엇인지는 글과 여백이 말해 준다.
    그래서 우리 화면의 실선과 같은 두께로 두고 여기서 재지 않는다 -
    잴 필요가 없는 것에 기준을 걸면 검사기를 못 믿게 된다.
  */
  ["적는 자리 테두리(UI 경계)", "--ours-control-border", "--color-canvas-default", 3],
  ["단추 테두리(UI 경계)", "--color-btn-border", "--color-canvas-default", 3],
];
const GUESTBOOK_CASES = [
  ["쪽지 위 글자", "--color-fg-default", "--ours-surface", 4.5],
  ["쪽지 위 보조 글자", "--ours-muted", "--ours-surface", 4.5],
];
const THEMES = [
  ["댓글 라이트", "public/giscus-light.css", GISCUS_CASES],
  ["댓글 다크", "public/giscus-dark.css", GISCUS_CASES],
  ["방명록 라이트", "public/giscus-guestbook-light.css", [...GISCUS_CASES, ...GUESTBOOK_CASES]],
  ["방명록 다크", "public/giscus-guestbook-dark.css", [...GISCUS_CASES, ...GUESTBOOK_CASES]],
];

/*
  giscus 앱 CSS 가 읽는 단추·입력칸 토큰 (2026-09-06 기준).

  하나라도 비면 그 상태에서 GitHub 팔레트가 그대로 새어 나온다.
  실제로 비활성 색을 안 덮어 "댓글 등록"이 초록으로 떠 있었다 -
  쉬는 상태만 보고 끝냈기 때문이다.

  목록은 `giscus.app/_next/static/css/*.css` 에서 `var(--color-btn-*|--color-input-*)` 를
  훑어 뽑았다. giscus 가 새 상태를 쓰기 시작하면 이 목록이 낡는데,
  그때는 화면에서 남의 색이 보이므로 여기 한 줄 더 적으면 된다.
*/
const REQUIRED = [
  "--color-btn-text",
  "--color-btn-bg",
  "--color-btn-border",
  "--color-btn-hover-bg",
  "--color-btn-hover-border",
  "--color-btn-active-bg",
  "--color-btn-active-border",
  "--color-btn-shadow",
  "--color-btn-inset-shadow",
  "--color-btn-primary-bg",
  "--color-btn-primary-text",
  "--color-btn-primary-border",
  "--color-btn-primary-hover-bg",
  "--color-btn-primary-hover-border",
  "--color-btn-primary-selected-bg",
  "--color-btn-primary-selected-shadow",
  "--color-btn-primary-disabled-bg",
  "--color-btn-primary-disabled-text",
  "--color-btn-primary-disabled-border",
  "--color-btn-primary-shadow",
  "--color-btn-primary-inset-shadow",
  "--color-input-bg",
  "--color-input-border",
  "--color-input-contrast-bg",
];

for (const [themeName, file] of THEMES) {
  const t = varsIn(read(file), "main {");
  const missing = REQUIRED.filter((k) => !t[k]);
  if (missing.length > 0) {
    failed += missing.length;
    console.log("");
    console.log("── giscus · " + themeName + " · 안 덮은 토큰 ──");
    for (const k of missing) console.log("FAIL " + k + " 이 없다 — 그 상태에서 GitHub 색이 나온다");
  }
}

for (const [themeName, file, cases] of THEMES) {
  const t = varsIn(read(file), "main {");
  console.log("");
  console.log("── giscus · " + themeName + " ──");
  const canvas = parse(t["--color-canvas-default"]);
  for (const [label, fgKey, bgKey, min] of cases) {
    if (!t[fgKey] || !t[bgKey]) {
      failed += 1;
      console.log("FAIL " + (t[fgKey] ? bgKey : fgKey) + " 이 없다 — " + label);
      continue;
    }
    const base = over(parse(t[bgKey]), canvas);
    const fg = over(parse(t[fgKey]), base);
    const r = ratio(fg, base);
    const ok = r >= min;
    if (!ok) failed += 1;
    console.log(
      (ok ? "OK  " : "FAIL") + " " + r.toFixed(2).padStart(6) + ":1  (기준 " + min + ") " + label,
    );
  }
}

console.log(`\n기준 미달: ${failed}건`);
process.exit(failed ? 1 : 0);
