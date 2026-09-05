"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "@/components/icons";
import { NAV } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

const SOCIAL = [
  { label: "GitHub", href: "https://github.com/INSANE-P" },
  { label: "포트폴리오", href: "https://portfolio.chanbin.dev" },
  { label: "메일", href: "mailto:chanbin0626@gmail.com" },
];

/**
 * 모바일 내비 (ADR-0024·0025).
 *
 * 얼음판이 퍼지는 연출과 눈송이 장식을 걷어냈다. 브랜드가 활자로 바뀌면서
 * 장식을 얹을 자리가 없어졌고, 메뉴는 목적지로 빨리 데려다주면 되는 화면이다.
 * 터치 대상은 44px 이상으로 잡는다(피츠의 법칙).
 */
export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        className="inline-flex size-11 items-center justify-center text-foreground transition hover:text-accent"
      >
        <Menu size={24} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="mx-auto flex h-full max-w-md flex-col px-6 py-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-[20px] font-black uppercase tracking-tight">
                CHANBIN<span className="text-accent">.</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="inline-flex size-11 items-center justify-center text-foreground transition hover:text-accent"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-2">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`py-3 font-display text-[40px] font-extrabold leading-tight tracking-tight transition-colors ${
                      active ? "text-accent" : "text-foreground hover:text-accent"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center justify-between pb-1">
              <div className="flex gap-4 text-sm text-muted">
                {SOCIAL.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target={s.href.startsWith("http") ? "_blank" : undefined}
                    rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="py-2 transition hover:text-accent"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
