"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "./MobileNav";
import { NAV } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

/**
 * 헤더 (ADR-0024).
 *
 * 로고는 그림이 아니라 활자다 — 포트폴리오와 같은 아웃라인 워드마크를 쓴다.
 * 마스코트나 심볼을 두지 않는 이유는, 유지할 브랜드 자산을 늘리지 않기 위해서다.
 */
export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="group" aria-label="홈으로">
          <span className="font-display text-[17px] font-extrabold uppercase tracking-tight">
            <span className="stroke-text stroke-hover-accent transition-all">CHANBIN</span>
            <span className="text-accent">.</span>
          </span>
        </Link>

        <MobileNav className="sm:hidden" />

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2 text-[15px] transition-colors ${
                  active ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="ml-1.5">
            <ThemeToggle />
          </span>
        </nav>
      </div>
    </header>
  );
}
