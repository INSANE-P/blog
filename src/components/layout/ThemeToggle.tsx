"use client";

import { useEffect, useState } from "react";

const f = (n: number) => n.toFixed(2);
/** 중심(12,12)에서 반지름 r, 각 a(도) 지점 */
const at = (r: number, a: number): [number, number] => [
  12 + r * Math.cos((a * Math.PI) / 180),
  12 + r * Math.sin((a * Math.PI) / 180),
];

/** 뾰족한 광선 하나 — 밑변은 r0에서 폭 w, 꼭짓점은 r1 */
function ray(a: number, r0: number, r1: number, w: number): string {
  const d = (Math.atan2(w / 2, r0) * 180) / Math.PI;
  const [ax, ay] = at(r0, a - d);
  const [bx, by] = at(r1, a);
  const [cx, cy] = at(r0, a + d);
  return `M ${f(ax)},${f(ay)} L ${f(bx)},${f(by)} L ${f(cx)},${f(cy)} Z`;
}

/**
 * 광선 열둘. 길고 짧은 것을 번갈아 둔다 —
 * 길이가 모두 같으면 톱니바퀴로 보이고, 엇갈리면 빛이 뻗는 것으로 보인다.
 */
const RAYS = Array.from({ length: 12 }, (_, k) => {
  const long = k % 2 === 0;
  return {
    d: ray(k * 30 - 90, 5.6, long ? 10.6 : 8.6, long ? 2.4 : 1.9),
    opacity: long ? 0.85 : 0.55,
  };
});

/** 네 갈래 스파클 — 변을 오목하게 당겨 끝이 가늘어진다 */
function sparkle(cx: number, cy: number, R: number, waist = 0.17): string {
  const w = R * waist;
  return [
    `M ${f(cx)},${f(cy - R)}`,
    `Q ${f(cx + w)},${f(cy - w)} ${f(cx + R)},${f(cy)}`,
    `Q ${f(cx + w)},${f(cy + w)} ${f(cx)},${f(cy + R)}`,
    `Q ${f(cx - w)},${f(cy + w)} ${f(cx - R)},${f(cy)}`,
    `Q ${f(cx - w)},${f(cy - w)} ${f(cx)},${f(cy - R)}`,
    "Z",
  ].join(" ");
}

const STAR_MAIN = sparkle(12, 12, 9.4);
const STAR_SUB = [
  { d: sparkle(19.4, 5.4, 3.2, 0.2), opacity: 0.75 },
  { d: sparkle(5, 18.4, 2.3, 0.2), opacity: 0.55 },
];

/**
 * 테마 토글 (ADR-0026).
 *
 * 라이트는 해, 다크는 별 하나다. 누르면 해가 돌면서 오므라들고 그 자리에서 별이 돌며 피어난다.
 *
 * 후보를 실제 크기로 렌더해 놓고 골랐다. 화면을 보지 않고 정하면 설명만 그럴듯한 것이 나온다.
 * 반차 원(◐)은 21px에서 회색 덩어리였고, "타원 궤도 + 가운데 점"은 눈알로 보였다.
 * 별자리 안은 규칙적으로 두면 꺾은선 그래프로 읽혔다.
 *
 * 해는 일부러 단순한 기하 도형을 피했다. 광선 열둘을 길고 짧게 엇갈리게 두면
 * 톱니바퀴가 아니라 빛이 뻗는 모양이 된다. 별도 정다각형이 아니라 변을 오목하게 당겨,
 * 끝이 가늘어지며 반짝이는 형태로 그렸다. 작은 스파클 둘이 균형과 깊이를 준다.
 *
 * 색은 악센트 하나뿐 — 해의 몸통과 큰 별. 헤더에서 색을 가진 유일한 요소라
 * 시선이 정확히 여기에 온다(폰 레스토프 효과).
 *
 * 전환은 두 그림을 각각 회전·확대·투명도로만 여닫는다. 모양을 서로 모핑하지 않는 이유는,
 * 광선 열둘과 스파클은 점 개수가 달라 중간 프레임이 반드시 뭉개지기 때문이다.
 * 회전을 서로 반대로 줘서 갈아 끼우는 느낌이 아니라 하나가 돌아 다른 하나가 되게 했다.
 *
 * - 저장: localStorage('theme'). 루트 init 스크립트가 초기 클래스를 칠해 깜빡임 없음.
 * - 테마 자체는 누른 지점에서 번지듯/거둬지듯 바뀐다(View Transitions, animations.css).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setAnimate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMounted(true);
  }, []);

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const next = !dark;
    const apply = () => {
      setDark(next);
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem("theme", next ? "dark" : "light");
      } catch {
        // localStorage 접근 불가(시크릿 등) 시 무시 — 토글 자체는 동작
      }
    };

    const root = document.documentElement;
    const startVT = (
      document as Document & { startViewTransition?: (cb: () => void) => unknown }
    ).startViewTransition?.bind(document);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 미지원/모션 최소화 → 즉시 전환
    if (!startVT || reduce) {
      apply();
      return;
    }

    // 누른 지점에서 화면 가장 먼 모서리까지가 원의 반경
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-r", `${r}px`);

    // 다크 켜기 → 번져 나감(reveal), 끄기 → 칠해졌던 테마가 지점으로 거둬짐(conceal)
    const dir = next ? "vt-reveal" : "vt-conceal";
    root.classList.add(dir);
    const vt = startVT(apply) as { finished?: Promise<void> };
    Promise.resolve(vt?.finished).finally(() => root.classList.remove(dir));
  }

  // 첫 렌더에는 전환을 끈다 — 켜 두면 페이지를 열 때 아이콘이 혼자 돈다
  const moving = mounted && animate;
  const swap = moving
    ? { transition: "transform 0.55s cubic-bezier(0.34, 1.2, 0.5, 1), opacity 0.35s ease" }
    : {};

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className={`inline-flex size-10 items-center justify-center rounded-xl text-muted transition-colors hover:text-foreground ${className}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
        {/* 해 — 다크에서는 돌면서 오므라든다 */}
        <g
          style={{
            transform: `rotate(${dark ? 60 : 0}deg) scale(${dark ? 0 : 1})`,
            transformOrigin: "12px 12px",
            opacity: dark ? 0 : 1,
            ...swap,
          }}
        >
          {RAYS.map((r, i) => (
            <path key={i} d={r.d} fill="currentColor" opacity={r.opacity} />
          ))}
          <circle cx="12" cy="12" r="4.1" fill="var(--accent)" />
        </g>

        {/* 별 — 반대 방향으로 돌며 피어난다 */}
        <g
          style={{
            transform: `rotate(${dark ? 0 : -70}deg) scale(${dark ? 1 : 0})`,
            transformOrigin: "12px 12px",
            opacity: dark ? 1 : 0,
            ...swap,
          }}
        >
          <path d={STAR_MAIN} fill="var(--accent)" />
          {STAR_SUB.map((s, i) => (
            <path key={i} d={s.d} fill="currentColor" opacity={s.opacity} />
          ))}
        </g>
      </svg>
    </button>
  );
}
