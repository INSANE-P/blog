"use client";

import { useEffect, useState } from "react";

/**
 * 읽기 진행 바 (ADR-0027).
 *
 * 긴 글에서 "얼마나 남았나"를 모르면 읽다 말고 스크롤바를 확인하게 된다.
 * 헤더 바로 아래에 3px 짜리 선 하나만 둔다 — 퍼센트 숫자를 띄우면 글이 아니라
 * 진도를 보게 만든다.
 *
 * 스크롤 이벤트마다 계산하지 않고 다음 프레임에 한 번만 계산한다.
 * 스크롤은 초당 수십 번 발생하는데 그때마다 레이아웃 값을 읽으면 스크롤이 끊긴다.
 */
export function ReadingProgress() {
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setRatio(scrollable > 0 ? Math.min(1, doc.scrollTop / scrollable) : 0);
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
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] print:hidden"
    >
      <div
        className="h-full bg-accent"
        style={{ width: `${ratio * 100}%`, transition: "width 90ms linear" }}
      />
    </div>
  );
}
