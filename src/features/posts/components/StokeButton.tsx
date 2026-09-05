"use client";

import { useEffect, useState } from "react";
import { stokePost } from "../actions";

const storageKey = (slug: string) => `stoked:${slug}`;

/** 네 갈래 스파클 — 테마 토글의 별과 같은 도형이다. 이 사이트에서 "좋다"는 이 모양으로 말한다. */
function Sparkle({ size = 20 }: { size?: number }) {
  const R = 9.4;
  const w = R * 0.17;
  const d = [
    `M 12,${12 - R}`,
    `Q ${12 + w},${12 - w} ${12 + R},12`,
    `Q ${12 + w},${12 + w} 12,${12 + R}`,
    `Q ${12 - w},${12 + w} ${12 - R},12`,
    `Q ${12 - w},${12 - w} 12,${12 - R}`,
    "Z",
  ].join(" ");
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

/**
 * 글 끝 반응 (ADR-0028).
 *
 * "불 지피기"였던 것을 바꿨다. 불꽃은 예전 정체성(설화·서리)에 딸린 은유였는데
 * 그 정체성을 걷어내면서 색 토큰(--flame-*)까지 지워, 불꽃이 정의되지 않은 색으로
 * 그려지고 있었다. 은유만 남고 근거는 사라진 상태였다.
 *
 * 대신 스파클을 쓴다. 다크 모드의 별과 같은 도형이라 이 사이트 안에서 뜻이 이어지고,
 * 반짝임은 설명 없이 "좋았다"로 읽힌다.
 *
 * 로그인을 요구하지 않는 것이 이 버튼의 존재 이유다. 댓글은 GitHub 계정이 있어야 하지만
 * 글이 좋았다는 말은 그 문턱 없이 남길 수 있어야 한다. 중복은 브라우저당 한 번으로
 * 가볍게 막는다 — 엄밀히 세는 것이 목적이 아니라 반응을 받는 것이 목적이다.
 *
 * 숫자는 누른 사람에게만 보인다. 0으로 시작하는 숫자가 보이면 아무도 안 눌렀다는 사실이
 * 먼저 읽혀서, 누르려던 사람도 손을 거둔다.
 */
export function StokeButton({ slug, initial = 0 }: { slug: string; initial?: number }) {
  const [count, setCount] = useState(initial);
  const [mine, setMine] = useState(false);
  const [pending, setPending] = useState(false);

  // localStorage는 클라이언트에서만 — 하이드레이션 이후 내 상태를 복원한다.
  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey(slug))) setMine(true);
    } catch {
      // 접근 불가(시크릿 등) 시 무시
    }
  }, [slug]);

  async function react() {
    if (mine || pending) return;
    setMine(true);
    setPending(true);
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
        // 무시 — 이번 세션 동안은 누른 상태로 동작
      }
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={react}
      aria-pressed={mine}
      disabled={pending || mine}
      className={`group inline-flex items-center gap-2.5 rounded-full border px-6 py-3 text-[15px] font-semibold transition-colors ${
        mine
          ? "border-accent/45 bg-tint text-accent-text"
          : "border-hairline text-muted hover:border-accent/45 hover:text-accent-text"
      }`}
    >
      <span
        className={`transition-transform ${mine ? "text-accent" : "text-muted group-hover:scale-110 group-hover:text-accent"}`}
      >
        <Sparkle />
      </span>
      {mine ? "고마워요" : "좋았어요"}
      {mine && <span className="tabular-nums font-bold">{count}</span>}
    </button>
  );
}
