"use client";

import { useState } from "react";
import { Check, Copy } from "@/components/icons";

/**
 * 코드 블록 (ADR-0027).
 *
 * 회색 상자만 두면 노션·깃허브와 구분되지 않는다. 위에 줄을 하나 얹어 언어를 밝히고
 * 복사 버튼을 둔다. 코드를 읽는 사람이 실제로 하는 일이 "이게 무슨 언어지"와 "가져다 쓰기"라서,
 * 그 둘만 손에 닿는 곳에 둔다.
 *
 * 복사 결과는 아이콘과 글자를 함께 바꿔서 알린다. 색만 바꾸면 색을 구분하기 어려운 사람에게는
 * 아무 일도 일어나지 않은 것과 같다.
 */
export function CodeBlock({ lang, code, children }: { lang?: string; code: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // 클립보드 권한이 없으면 조용히 넘어간다 — 코드는 그대로 드래그해 복사할 수 있다
    }
  }

  return (
    <div className="my-8 overflow-hidden rounded-[14px] border border-hairline bg-code-bg">
      <div className="flex items-center justify-between border-b border-hairline bg-code-bar py-2.5 pl-4 pr-2.5">
        <span className="font-mono text-[12px] font-semibold tracking-wide text-muted">
          {lang ?? "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[12px] font-semibold text-muted transition-colors hover:text-accent-text"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "복사했어요" : "복사"}
        </button>
      </div>
      {children}
    </div>
  );
}
