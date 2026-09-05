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
const css = fs.readFileSync(path.join(REPO, "src/styles/tokens.css"), "utf8");

function vars(selector) {
  const i = css.indexOf(selector);
  const body = css.slice(css.indexOf("{", i) + 1, css.indexOf("}", i));
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

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
  ["브랜드 색(로고 점·진행 바 — 그림 요소)", "--accent", "--background", 3],
  ["체크박스 테두리(UI 경계)", "--muted", "--background", 3],
  ["보조 글자 위 옅은 면(목차·푸터)", "--muted", "--surface-hover", 4.5],
  ["보조 글자 위 코드 머리줄", "--muted", "--code-bar", 4.5],
  ["본문 글자 위 코드 배경", "--prose-fg", "--code-bg", 4.5],

];

let failed = 0;
for (const mode of ["라이트", "다크"]) {
  const t = mode === "라이트" ? vars(":root {") : vars(".dark {");
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
console.log(`\n기준 미달: ${failed}건`);
process.exit(failed ? 1 : 0);
