"use client";

import { useEffect, useState } from "react";
import { stokePost } from "../actions";

/** 설화의 불꽃(겉불 + 속불). 색은 --flame-* 토큰이라 라이트/다크에서 다르게 보인다. */
const FLAME =
  "M40 58 C28 58 20 52 21 43 C21 36 24 31 28 33 C30 26 34 19 40 16 C46 19 50 26 52 33 C56 31 59 37 58 44 C58 53 52 58 40 58 Z";
const FLAME_INNER =
  "M40 53 C31 53 26 49 26 43 C26 38 28 34 31 36 C33 30 36 25 40 23 C44 25 47 30 49 36 C52 34 54 38 54 43 C54 49 49 53 40 53 Z";

const storageKey = (slug: string) => `stoked:${slug}`;

/**
 * 누른 지점에서 frost 빛이 원형으로 화면을 한 번 퍼졌다 빠르게 사라지는 연출.
 * 색(번짐·링)은 .dark 스코프 CSS로 라이트/다크에 맞춘다. 모션 최소화 설정이면 안 만든다.
 */
function fireBurst(x: number, y: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const base = Math.max(window.innerWidth, window.innerHeight) * 0.5;

  const root = document.createElement("div");
  root.className = "stoke-burst";

  const place = (el: HTMLDivElement) => {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  };

  const wash = document.createElement("div");
  wash.className = "sb-fx sb-wash";
  place(wash);
  wash.style.width = wash.style.height = `${base}px`;
  wash.style.animation = "sb-wash 0.7s ease-out forwards";
  root.appendChild(wash);

  const ring = document.createElement("div");
  ring.className = "sb-fx sb-ring";
  place(ring);
  ring.style.width = ring.style.height = `${base * 0.9}px`;
  ring.style.animation = "sb-ring 0.72s ease-out forwards";
  root.appendChild(ring);

  document.body.appendChild(root);
  window.setTimeout(() => root.remove(), 900);
}

/**
 * "불 지피기" 반응 버튼 — 평소 일렁이고, 호버하면 피어오르고, 누르면 한 번 크게 타오른다.
 * 누르면 좁은 RPC(stokePost)로 카운트가 DB에 영속된다(ADR-0016).
 * 중복은 브라우저당 1회(localStorage)로 가볍게 막는다 — 이미 지핀 글은 다시 못 누른다.
 */
export function StokeButton({ slug, initial = 0 }: { slug: string; initial?: number }) {
  const [count, setCount] = useState(initial);
  const [mine, setMine] = useState(false);
  const [lit, setLit] = useState(false);
  const [pending, setPending] = useState(false);

  // localStorage는 클라이언트에서만 — 하이드레이션 이후 내 상태를 복원한다.
  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey(slug))) setMine(true);
    } catch {
      // 접근 불가(시크릿 등) 시 무시
    }
  }, [slug]);

  async function stoke(e: React.MouseEvent<HTMLButtonElement>) {
    if (mine || pending) return;
    const rect = e.currentTarget.getBoundingClientRect();
    fireBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    setMine(true);
    setPending(true);
    setLit(true);
    window.setTimeout(() => setLit(false), 600);
    setCount((c) => c + 1); // 낙관적 반영

    const next = await stokePost(slug);
    if (next === null) {
      setMine(false); // 실패 → 되돌리기
      setCount((c) => c - 1);
    } else {
      setCount(next); // 서버 권위값(다른 사람 반응까지 반영)
      try {
        localStorage.setItem(storageKey(slug), "1");
      } catch {
        // 무시 — 이번 세션 동안은 지핀 상태로 동작
      }
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={stoke}
      aria-pressed={mine}
      disabled={pending}
      className={`stoke inline-flex items-center gap-2.5 rounded-full border px-6 py-3 transition hover:-translate-y-0.5 ${
        lit ? "is-lit" : ""
      } ${mine ? "is-mine" : ""}`}
      style={{
        borderColor: mine ? "var(--accent)" : "var(--border)",
        background: mine
          ? "color-mix(in srgb, var(--accent) 12%, var(--surface))"
          : "var(--surface)",
      }}
    >
      <svg width="24" height="24" viewBox="16 12 48 48" aria-hidden className="overflow-visible">
        <defs>
          <linearGradient
            id="stoke-grad"
            gradientUnits="userSpaceOnUse"
            x1="40"
            y1="16"
            x2="40"
            y2="58"
          >
            <stop offset="0" stopColor="var(--flame-top)" />
            <stop offset="0.4" stopColor="var(--flame-mid)" />
            <stop offset="0.78" stopColor="var(--flame-low)" />
            <stop offset="1" stopColor="var(--flame-base)" />
          </linearGradient>
        </defs>
        <g className="stoke-flame">
          <g className="stoke-flicker">
            <path d={FLAME} fill="url(#stoke-grad)" />
            <path d={FLAME_INNER} fill="var(--flame-inner)" />
          </g>
        </g>
      </svg>
      <span className={`text-[15px] font-medium ${mine ? "text-accent-text" : "text-foreground"}`}>
        {mine ? "불 지폈어요" : "불 지피기"}
      </span>
      {/* 카운트는 "지핀 사람한테만" 보인다 — 참여 후 "나도 함께 지폈네"의 공개 순간 */}
      {mine && (
        <span className="text-[15px] font-bold text-accent-text tabular-nums">{count}</span>
      )}
    </button>
  );
}
