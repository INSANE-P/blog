"use client";

import { useEffect, useRef } from "react";

/**
 * 읽기 진행 바 (ADR-0027).
 *
 * 긴 글에서 "얼마나 남았나"를 모르면 읽다 말고 스크롤바를 확인하게 된다.
 * 헤더 맨 위에 3px 짜리 선 하나만 둔다 — 퍼센트 숫자를 띄우면 글이 아니라 진도를 보게 만든다.
 *
 * 세 가지를 지켜야 바가 손가락을 따라온다. 처음 만들었을 때 다 어겨서 눈에 띄게 늦었다.
 *
 *   1. 전환(transition)을 걸지 않는다.
 *      스크롤은 매 프레임 값이 바뀌는데 거기에 전환을 걸면 바가 늘 그만큼 뒤를 쫓는다.
 *      위치는 이미 연속적이라 부드럽게 만들 것이 없다.
 *
 *   2. width 가 아니라 transform: scaleX 로 늘린다.
 *      width 는 매 프레임 레이아웃을 다시 계산하지만 transform 은 합성 단계에서 끝난다.
 *
 *   3. 상태를 두지 않고 DOM 에 직접 쓴다.
 *      매 프레임 리렌더를 돌리면 React 가 스크롤보다 느려진다.
 *
 * 측정은 다음 프레임에 한 번만 한다. 스크롤 이벤트는 초당 수십 번 오는데
 * 그때마다 레이아웃 값을 읽으면 브라우저가 계산을 강제로 앞당겨 스크롤이 끊긴다.
 */
export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, doc.scrollTop / scrollable)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${ratio})`;
      if (tip.current) {
        // 부모가 가로로 눌린 만큼 되돌려야 점이 동그랗게 남는다
        const visible = ratio > 0.004;
        tip.current.style.opacity = visible ? "1" : "0";
        tip.current.style.transform = visible
          ? `translate(50%, -50%) scaleX(${1 / ratio})`
          : "translate(50%, -50%)";
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
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] print:hidden"
    >
      {/*
        선 끝에 빛이 맺힌다 — 전류가 달려간 자리로 읽힌다(ADR-0035).
        선 전체를 번개 모양으로 만들어 보았더니, 읽는 내내 화면 맨 위에서 톱니가 시끄러웠다.
        늘 보이는 것은 조용해야 하고, 특징은 끝점 하나로 충분하다.

        점은 선과 함께 늘어나면 안 되므로 scaleX 를 되돌린다(scaleX(1/ratio)).
        아주 짧을 때는 되돌리는 배수가 커져 점이 터지므로 그때는 숨긴다.
      */}
      <div
        ref={bar}
        className="relative h-full w-full origin-left bg-accent"
        style={{ transform: "scaleX(0)", willChange: "transform" }}
      >
        <span
          ref={tip}
          aria-hidden
          className="absolute right-0 top-1/2 block size-[7px] rounded-full bg-accent"
          style={{
            transform: "translate(50%, -50%)",
            boxShadow: "0 0 8px 2px color-mix(in srgb, var(--accent) 65%, transparent)",
          }}
        />
      </div>
    </div>
  );
}
