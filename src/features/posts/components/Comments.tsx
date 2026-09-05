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
 *
 * 커스텀 테마 CSS 를 giscus 가 불러오지 못하면 색 변수가 하나도 적용되지 않아
 * 글자색이 기본값인 검정이 된다. 흰 배경에서는 우연히 읽히지만 검은 배경에서는
 * 댓글이 통째로 보이지 않는다. 실제로 그 상태가 한 번 나왔다.
 *
 * 그래서 주소를 넘기기 전에 파일이 실제로 있는지 먼저 확인한다. 같은 출처라 CORS 문제가 없고,
 * 한 번 받아 두면 브라우저가 캐시한다. 없으면 내장 테마로 물러난다 —
 * 우리 색은 잃더라도 댓글이 안 보이는 것보다는 낫다.
 *
 * http(로컬)에서는 애초에 mixed-content 로 막히므로 확인 없이 내장 테마를 쓴다.
 */
export function Comments() {
  // 초기엔 내장 테마(SSR/하이드레이션 안전), 마운트 후 실제 환경에 맞춰 갱신
  const [theme, setTheme] = useState("noborder_light");

  useEffect(() => {
    let alive = true;

    const compute = async () => {
      const dark = document.documentElement.classList.contains("dark");
      const builtin = dark ? "noborder_dark" : "noborder_light";

      if (window.location.protocol !== "https:") {
        setTheme(builtin);
        return;
      }

      const url = `${window.location.origin}/giscus-${dark ? "dark" : "light"}.css`;
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (alive) setTheme(res.ok ? url : builtin);
      } catch {
        if (alive) setTheme(builtin);
      }
    };

    compute();
    const observer = new MutationObserver(() => void compute());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, []);

  return (
    <section aria-label="댓글">
      <SectionTitle>comments</SectionTitle>
      <p className="mt-2 text-[15px] text-muted">
        자유롭게 생각을 남겨주세요.
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
