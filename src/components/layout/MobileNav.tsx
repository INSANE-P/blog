"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "@/components/icons";
import { NAV } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

const SOCIAL = [
  { label: "GitHub", href: "https://github.com/INSANE-P" },
  { label: "포트폴리오", href: "https://portfolio.chanbin.dev" },
  { label: "메일", href: "mailto:chanbin0626@gmail.com" },
];

/**
 * 모바일 내비 (ADR-0024·0028).
 *
 * 화면을 가득 채운다. 작은 화면에서 드롭다운을 띄우면 목적지가 손가락 하나 크기로 줄어드는데,
 * 화면 전체를 쓰면 어디를 눌러도 닿는다(피츠의 법칙). 항목이 둘뿐이라 채울 것이 없다는 점이
 * 오히려 이 방식에 맞는다 — 큰 활자 두 개가 화면의 주인이 된다.
 *
 * 열릴 때는 위에서 아래로 펼쳐지고 항목이 차례로 올라온다. 한 번에 나타나면
 * 화면이 갈아 끼워진 것처럼 보이고, 순서가 있으면 "메뉴가 열렸다"로 읽힌다.
 *
 * 닫는 방법을 셋 둔다 — X, Esc, 항목 선택. 전체 화면을 덮는 것은 빠져나갈 길이 분명해야 한다.
 */
export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const pathname = usePathname();

  // 경로가 바뀌면(항목을 눌렀으면) 닫는다
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // 뒤 배경이 같이 스크롤되면 어디를 보고 있는지 잃는다
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // 다음 프레임에 전환을 켠다 — 같은 프레임에 켜면 애니메이션 없이 끝난 상태로 그려진다
    const frame = requestAnimationFrame(() => setShown(true));
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      cancelAnimationFrame(frame);
    };
  }, [open]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        className="-mr-2 inline-flex size-11 items-center justify-center text-foreground transition-colors hover:text-accent-text"
      >
        <Menu size={24} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background transition-opacity duration-200"
          style={{ opacity: shown ? 1 : 0 }}
        >
          <div className="flex h-dvh flex-col px-6">
            {/* 머리줄 — 열기 전 헤더와 같은 자리에 같은 크기로 둔다 */}
            <div className="flex h-[68px] shrink-0 items-center justify-between">
              <span className="font-display text-[20px] font-black uppercase tracking-tight">
                CHANBIN<span className="text-accent">.</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="-mr-2 inline-flex size-11 items-center justify-center text-foreground transition-colors hover:text-accent-text"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-1 pb-16">
              {NAV.map((item, i) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`py-3 text-[44px] font-extrabold leading-tight tracking-[-0.04em] transition-all duration-300 ${
                      active ? "text-accent-text" : "text-foreground"
                    }`}
                    style={{
                      opacity: shown ? 1 : 0,
                      transform: shown ? "none" : "translateY(14px)",
                      transitionDelay: `${60 + i * 60}ms`,
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div
              className="flex shrink-0 items-center justify-between border-t border-hairline py-5 transition-all duration-300"
              style={{
                opacity: shown ? 1 : 0,
                transform: shown ? "none" : "translateY(10px)",
                transitionDelay: `${60 + NAV.length * 60}ms`,
              }}
            >
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {SOCIAL.map((s) => {
                  const external = s.href.startsWith("http");
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-0.5 py-2 text-[15px] font-semibold text-muted transition-colors hover:text-accent-text"
                    >
                      {s.label}
                      {external && <ArrowUpRight size={14} />}
                    </a>
                  );
                })}
              </div>
              <ThemeToggle className="-mr-2" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
