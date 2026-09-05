import Link from "next/link";

/** 밖으로 나가는 링크만 둔다. 사이트 안의 이동은 붙박이 헤더가 맡는다. */
const ELSEWHERE = [
  { label: "github", href: "https://github.com/INSANE-P" },
  { label: "portfolio", href: "https://portfolio.chanbin.dev" },
  { label: "mail", href: "mailto:chanbin0626@gmail.com" },
];

/**
 * 푸터 (ADR-0028·0036).
 *
 * 사이트 지도가 아니라 마무리 인사다. 깊이가 목록 → 글 두 단계뿐이고 페이지가 둘뿐인데
 * 푸터에 열을 나눠 링크를 늘어놓으면, 있지도 않은 구조를 흉내 내는 셈이 된다.
 *
 * 그래서 셋을 걷어냈다.
 *
 *   - `pages` 열 — 붙박이 헤더가 항상 보여 주는 것을 한 번 더 적은 것이었다
 *   - 열 제목(`pages`·`elsewhere`) — 링크 셋에 붙인 제목은 없는 구조를 만든다
 *   - 태그라인 — 히어로와 모바일 메뉴에 이미 있다. 세 번째는 반복이다
 *
 * 남은 것은 누가 썼는지(워드마크·저작권)와 밖으로 나가는 길뿐이다.
 */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="flex items-baseline gap-4">
          <Link href="/" className="group">
            <span className="spark-line font-display text-[18px] font-black uppercase tracking-tight">
              CHANBIN<span className="text-accent">.</span>
            </span>
          </Link>
          <span className="text-[13px] text-muted/70">© {new Date().getFullYear()} 박찬빈</span>
        </div>

        <nav aria-label="바깥 링크" className="flex flex-wrap gap-x-7 gap-y-2">
          {ELSEWHERE.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="font-display text-[14px] lowercase text-muted transition-colors hover:text-accent-text"
            >
              <span className="spark-line">{label}</span>
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
