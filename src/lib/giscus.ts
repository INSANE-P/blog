"use client";

import { useEffect, useState } from "react";

/**
 * giscus 위젯이 쓸 테마 값 (ADR-0028·0040).
 *
 * 글의 댓글과 소개의 방명록이 같은 판단을 해야 해서 여기로 뺐다.
 * 판단은 두 가지다 — 지금 다크인가, 그리고 우리 테마 CSS 를 쓸 수 있는가.
 *
 * 커스텀 테마 CSS 를 giscus 가 불러오지 못하면 색 변수가 하나도 적용되지 않는다.
 * 개발 중에는 항상 그렇다 — giscus 는 https 이고 우리 개발 서버는 http 라
 * iframe 안에서 mixed-content 로 막힌다. 그래서 https 가 아니면 아예 시도하지 않고,
 * 맞으면 파일이 실제로 있는지 한 번 확인한 뒤에 넘긴다.
 *
 * 확인은 마운트 때 한 번뿐이다. 테마를 바꿀 때마다 확인하면 토글할 때마다
 * 네트워크 왕복을 기다리게 되어 "안 바뀐다"로 느껴진다.
 *
 * 폴백은 `noborder_*` 가 아니라 `light`/`dark` 다. noborder_dark 는 상자 배경이 #1e1e20 이라
 * 우리 순수 검정과 거의 붙어 상자가 구분되지 않는다.
 *
 * 그래도 CSS 가 실리지 않을 때를 대비해 iframe 의 바닥 색은 globals.css 에서
 * 우리 테마에 묶어 둔다(ADR-0040). 색은 잃어도 글자는 읽힌다.
 *
 * @param prefix public 아래 CSS 파일 이름의 앞부분. `giscus` → `/giscus-dark.css`
 */
export function useGiscusTheme(prefix: string): string {
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
    if (window.location.protocol !== "https:") {
      setCustomOk(false);
      return;
    }
    let alive = true;
    fetch(`${window.location.origin}/${prefix}-light.css`, { method: "HEAD" })
      .then((res) => alive && setCustomOk(res.ok))
      .catch(() => alive && setCustomOk(false));
    return () => {
      alive = false;
    };
  }, [prefix]);

  // 확인 전(null)에는 내장 테마로 둔다 — 잘못된 주소를 넘겨 색이 통째로 빠지는 것보다 낫다
  if (customOk === true) {
    return `${window.location.origin}/${prefix}-${dark ? "dark" : "light"}.css`;
  }
  return dark ? "dark" : "light";
}
