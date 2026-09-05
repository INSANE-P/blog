import type { Heading } from "@/lib/content/headings";

/**
 * 목차 (ADR-0025·0027).
 *
 * 절이 넷 이상일 때만 보여 준다. 두세 개짜리 글에서는 목차가 정보가 아니라
 * 본문 앞을 가로막는 장애물이 된다.
 *
 * 사이드바로 띄우지 않고 본문 흐름에 둔 이유는, 이 사이트의 화면이 한 번에 한 가지만
 * 하기 때문이다. 옆에 계속 떠 있는 목차는 읽는 동안 눈이 두 곳을 오가게 만든다.
 * 서버에서 그려 내려보내므로 자바스크립트가 늦게 와도 보이고 검색엔진에도 잡힌다.
 */
export function Toc({ headings }: { headings: Heading[] }) {
  if (headings.length < 4) return null;

  return (
    <nav aria-label="목차" className="mt-9 rounded-[14px] bg-surface-hover px-6 py-5">
      <h2 className="font-display text-[12px] font-extrabold uppercase tracking-[0.14em] text-muted">
        목차
      </h2>
      <ul className="mt-3">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="block py-1.5 text-[15px] leading-relaxed text-muted transition-colors hover:text-accent-text"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
