"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "./MobileNav";
import { NAV } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

/**
 * 헤더 (ADR-0024·0026).
 *
 * 로고는 그림이 아니라 활자다 — 포트폴리오와 같은 워드마크를 쓴다. 다만 헤더에서는
 * 속을 채운다. 히어로의 큰 아웃라인은 획이 굵어 형태가 읽히지만, 22px에서는 선만 남아
 * 흐려 보인다. 아웃라인은 크기가 클 때만 성립하는 장치다.
 *
 * 높이 76px, 항목 17px. 헤더가 얇고 글씨가 작으면 "어디로 갈 수 있는지"가 눈에
 * 들어오지 않는다. 누르는 대상은 크게 둔다(피츠의 법칙).
 *
 * 호버는 배경을 깔지 않고 글자색만 악센트로 바꾼다. 워드마크가 이미 그렇게 반응하는데
 * 메뉴만 회색 판이 깔리면 같은 화면에서 서로 다른 말을 하는 셈이 된다.
 */
export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] w-full max-w-[1080px] items-center justify-between px-6 sm:h-[76px] sm:px-10">
        <Link href="/" aria-label="홈으로" className="group">
          <span className="font-display text-[20px] font-black uppercase tracking-tight transition-colors group-hover:text-accent-text sm:text-[22px]">
            CHANBIN<span className="text-accent-text">.</span>
          </span>
        </Link>

        <MobileNav className="sm:hidden" />

        <nav className="hidden items-center sm:flex">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-[18px] py-[11px] text-[17px] transition-colors ${
                  active ? "font-bold text-foreground" : "font-semibold text-muted hover:text-accent-text"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <ThemeToggle className="ml-2" />
        </nav>
      </div>
    </header>
  );
}
