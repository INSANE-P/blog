"use client";

import { useEffect, useState } from "react";
import Giscus from "@giscus/react";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * 댓글 (ADR-0021·0028·0029).
 *
 * Giscus — 저장은 GitHub Discussions, 우리 백엔드 0. 설정값(repo-id·category-id)은 공개라
 * 하드코딩해도 안전하다.
 *
 * 처음에는 표식 타일 + 제목 + 부제목을 얹었다가 걷어냈다. 아이콘 타일에 두 줄을 붙인 모양은
 * 어느 서비스에나 있는 빈 상태 패턴이라 이 사이트의 것으로 읽히지 않았고, 무엇보다
 * giscus 가 이미 댓글 쓴 사람들의 얼굴을 보여 준다 — 그 위에 표식을 또 얹으면 얼굴이 둘이 된다.
 *
 * 대신 홈의 절 제목을 그대로 쓴다(아웃라인 대문자 + 한글 한 줄). 화면마다 다른 방식으로
 * 제목을 다는 것이 "직접 만든 것처럼" 보이지 않게 하는 가장 큰 원인이다.
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
      <SectionTitle>comments</SectionTitle>
      <p className="mt-2 text-[15px] text-muted">
        읽고 떠오른 생각이든 반박이든, 편하게 남겨주세요.
      </p>

      <div className="mt-7">
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
