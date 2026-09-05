"use client";

import { useEffect, useRef } from "react";

/**
 * 읽기 진행 바 (ADR-0027·0035).
 *
 * 긴 글에서 "얼마나 남았나"를 모르면 읽다 말고 스크롤바를 확인하게 된다.
 * 화면 맨 위에 선 하나만 둔다 — 퍼센트 숫자를 띄우면 글이 아니라 진도를 보게 만든다.
 *
 * 선은 링크 밑줄과 같은 번개 타일을 쓰고(`--spark-line`), 끝에는 불꽃이 맺힌다.
 * 촘촘한 톱니로 만들었더니 물결로 읽혔고, 흐리게 깔았더니 라이트 모드에서 사라졌다.
 * 대부분 평평하고 가끔 튀는 지금 모양이 읽는 동안 시끄럽지 않으면서 전류로 보인다.
 *
 * 세 가지를 지켜야 선이 손가락을 따라온다.
 *
 *   1. 전환(transition)을 걸지 않는다.
 *      스크롤은 매 프레임 값이 바뀌는데 거기에 전환을 걸면 늘 그만큼 뒤를 쫓는다.
 *
 *   2. 폭이 아니라 clip-path 로 드러낸다.
 *      폭을 바꾸면 매 프레임 레이아웃을 다시 계산하고, scaleX 로 늘리면 번개가 가로로 찌그러진다.
 *
 *   3. 상태를 두지 않고 DOM 에 직접 쓴다.
 *      매 프레임 리렌더를 돌리면 React 가 스크롤보다 느려진다.
 *
 * 측정은 다음 프레임에 한 번만 한다. 스크롤 이벤트는 초당 수십 번 오는데
 * 그때마다 레이아웃 값을 읽으면 브라우저가 계산을 강제로 앞당겨 스크롤이 끊긴다.
 */
export function ReadingProgress() {
  const line = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, doc.scrollTop / scrollable)) : 0;

      if (line.current) {
        line.current.style.clipPath = `inset(0 ${((1 - ratio) * 100).toFixed(3)}% 0 0)`;
      }
      if (tip.current) {
        // innerWidth 는 레이아웃을 강제하지 않는다. 선의 끝에 불꽃을 얹는다.
        tip.current.style.transform = `translate3d(${(ratio * window.innerWidth).toFixed(1)}px, -50%, 0) translateX(-50%)`;
        tip.current.style.opacity = ratio > 0.002 ? "1" : "0";
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[10px] print:hidden">
      {/* 번개 결의 선 — 링크 밑줄과 같은 타일이라 사이트 안에서 뜻이 이어진다 */}
      <div
        ref={line}
        className="absolute inset-0 bg-accent"
        style={{
          WebkitMaskImage: "var(--spark-line)",
          maskImage: "var(--spark-line)",
          WebkitMaskRepeat: "repeat-x",
          maskRepeat: "repeat-x",
          WebkitMaskPosition: "left center",
          maskPosition: "left center",
          WebkitMaskSize: "auto 100%",
          maskSize: "auto 100%",
          clipPath: "inset(0 100% 0 0)",
          opacity: 0.9,
        }}
      />
      {/* 끝의 불꽃 */}
      <span
        ref={tip}
        className="absolute left-0 top-1/2 block size-[8px] rounded-full bg-accent opacity-0"
        style={{
          transform: "translate3d(0, -50%, 0) translateX(-50%)",
          boxShadow: "0 0 10px 3px color-mix(in srgb, var(--accent) 70%, transparent)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
