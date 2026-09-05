"use client";

import { useEffect, useState } from "react";
import Giscus from "@giscus/react";

/**
 * 글 마크 (ADR-0028).
 *
 * 댓글 상자 옆에 사람 아이콘 대신 이 사이트의 표식을 둔다. 기본 아바타는 어느 블로그에나
 * 똑같이 붙어 있어 "여기가 누구의 자리인지"를 말해 주지 않는다.
 *
 * 도형은 해다 — 테마 토글의 라이트 모드와 같은 광선이라, 헤더에서 본 것이 여기서 다시 나온다.
 * 마스코트를 만들지 않는 것은 유지할 브랜드 자산을 늘리지 않기 위해서다(ADR-0024).
 */
function AuthorMark() {
  const rays = Array.from({ length: 12 }, (_, k) => {
    const a = ((k * 30 - 90) * Math.PI) / 180;
    const long = k % 2 === 0;
    const r0 = 5.6;
    const r1 = long ? 10.6 : 8.6;
    const w = long ? 2.4 : 1.9;
    const d = Math.atan2(w / 2, r0);
    const p = (r: number, t: number) =>
      `${(12 + r * Math.cos(t)).toFixed(2)},${(12 + r * Math.sin(t)).toFixed(2)}`;
    return { d: `M ${p(r0, a - d)} L ${p(r1, a)} L ${p(r0, a + d)} Z`, o: long ? 0.85 : 0.55 };
  });

  return (
    <span
      aria-hidden
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint text-muted"
    >
      <svg width="26" height="26" viewBox="0 0 24 24">
        {rays.map((r, i) => (
          <path key={i} d={r.d} fill="currentColor" opacity={r.o} />
        ))}
        <circle cx="12" cy="12" r="4.1" fill="var(--accent)" />
      </svg>
    </span>
  );
}

/**
 * 댓글 (ADR-0021·0028).
 *
 * Giscus — 저장은 GitHub Discussions, 우리 백엔드 0. 설정값(repo-id·category-id)은 공개라
 * 하드코딩해도 안전하다.
 *
 * 상자 위에 한 줄을 붙인다. giscus 는 로그인 전에 "Sign in with GitHub" 만 보여 주는데,
 * 그것만으로는 왜 로그인해야 하는지가 안 보인다. 무엇을 남기면 되는지 먼저 말한다.
 *
 * 테마는 우리 .dark 클래스를 감시해 맞춘다.
 * - https(배포): 우리 색으로 덮은 커스텀 테마 CSS. giscus 는 테마 CSS 를 https 로만 불러온다
 * - http(로컬): mixed-content 로 막히므로 내장 noborder 테마로 폴백
 */
export function Comments() {
  // 초기엔 내장 테마(SSR/하이드레이션 안전), 마운트 후 실제 환경에 맞춰 갱신
  const [theme, setTheme] = useState("noborder_light");

  useEffect(() => {
    const compute = () => {
      const dark = document.documentElement.classList.contains("dark");
      if (window.location.protocol === "https:") {
        setTheme(`${window.location.origin}/giscus-${dark ? "dark" : "light"}.css`);
      } else {
        setTheme(dark ? "noborder_dark" : "noborder_light");
      }
    };
    compute();
    const observer = new MutationObserver(compute);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-label="댓글">
      <div className="flex items-center gap-4">
        <AuthorMark />
        <div className="min-w-0">
          <p className="text-[16px] font-bold">읽고 떠오른 게 있다면 남겨주세요</p>
          <p className="mt-1 text-[14px] text-muted">GitHub 계정으로 바로 쓸 수 있어요.</p>
        </div>
      </div>

      <div className="mt-6">
        <Giscus
          repo="INSANE-P/frost-log"
          repoId="R_kgDOS4XX0g"
          category="댓글"
          categoryId="DIC_kwDOS4XX0s4C_-zB"
          mapping="pathname"
          strict="1"
          reactionsEnabled="0"
          emitMetadata="0"
          inputPosition="bottom"
          theme={theme}
          lang="ko"
          loading="lazy"
        />
      </div>
    </section>
  );
}
