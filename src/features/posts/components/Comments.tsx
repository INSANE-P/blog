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
 * 폴백은 `noborder_*` 가 아니라 `light`/`dark` 다. noborder_dark 는 상자 배경이 #1e1e20 이라
 * 우리 순수 검정과 거의 붙어 상자가 구분되지 않고, 글자도 10.5:1 로 흐리다.
 * `dark` 는 글자가 16:1 이고 테두리가 있어 상자가 떨어져 보인다 —
 * 폴백에서는 우리 결보다 읽히는 것이 먼저다.
 *
 * http(로컬)에서는 애초에 mixed-content 로 막히므로 확인 없이 내장 테마를 쓴다.
 */
export function Comments() {
  // 커스텀 테마 파일을 쓸 수 있는지 — 마운트 때 한 번만 확인한다
  const [customOk, setCustomOk] = useState<boolean | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    /*
      확인은 마운트 때 한 번뿐이다. 테마를 바꿀 때마다 확인하면 토글할 때마다
      네트워크 왕복을 기다리게 되어 "안 바뀐다"로 느껴진다.
      파일이 있는지 없는지는 이 화면이 떠 있는 동안 변하지 않는다.
    */
    if (window.location.protocol !== "https:") {
      setCustomOk(false);
      return;
    }
    let alive = true;
    fetch(`${window.location.origin}/giscus-light.css`, { method: "HEAD" })
      .then((res) => alive && setCustomOk(res.ok))
      .catch(() => alive && setCustomOk(false));
    return () => {
      alive = false;
    };
  }, []);

  // 확인 전(null)에는 내장 테마로 둔다 — 잘못된 주소를 넘겨 색이 통째로 빠지는 것보다 낫다
  const theme =
    customOk === true
      ? `${window.location.origin}/giscus-${dark ? "dark" : "light"}.css`
      : dark
        ? "dark"
        : "light";

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
