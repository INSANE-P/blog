"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinkIcon, Menu, X } from "@/components/icons";
import { NAV } from "./nav";
import { ThemeToggle } from "./ThemeToggle";

/* 링크 이름은 표지에 속하므로 영문 소문자로 둔다(ADR-0029) */
const SOCIAL = [
  { label: "github", href: "https://github.com/INSANE-P" },
  { label: "portfolio", href: "https://portfolio.chanbin.dev" },
  { label: "mail", href: "mailto:chanbin0626@gmail.com" },
];

/**
 * 모바일 내비 (ADR-0024·0028).
 *
 * 화면을 가득 채운다. 작은 화면에서 드롭다운을 띄우면 목적지가 손가락 하나 크기로 줄어드는데,
 * 화면 전체를 쓰면 어디를 눌러도 닿는다(피츠의 법칙). 항목이 둘뿐이라 채울 것이 없다는 점이
 * 오히려 이 방식에 맞는다 — 큰 활자 두 개가 화면의 주인이 된다.
 *
 * 항목이 차례로 올라온다. 한 번에 나타나면 화면이 갈아 끼워진 것처럼 보이고,
 * 순서가 있으면 "메뉴가 열렸다"로 읽힌다. 배경은 움직이지 않는다 — 아래 주석 참고.
 *
 * 닫는 방법을 셋 둔다 — X, Esc, 항목 선택. 전체 화면을 덮는 것은 빠져나갈 길이 분명해야 한다.
 *
 * 덮개는 반드시 body 로 옮겨 그린다(포털). 헤더에 backdrop-filter 가 걸려 있는데,
 * backdrop-filter 를 가진 요소는 자기 자손의 position:fixed 기준점이 된다.
 * 그대로 두면 inset-0 이 화면 전체가 아니라 헤더 박스(가로 전체 × 68px)를 가리켜서,
 * 덮개가 헤더 높이만큼만 칠해지고 그 아래로 뒤 페이지가 그대로 비친다.
 */
export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  // 포털은 DOM 이 있어야 하므로 마운트 이후에만 그린다(서버 렌더 안전)
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

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

      {/*
        덮개 배경은 처음부터 불투명하다. 여기에 페이드를 걸면 열리는 동안 뒤 페이지가
        그대로 비친다 — 특히 다크에서는 배경끼리 같은 검정이라 히어로의 흰 글자만 떠올라
        화면이 깨진 것처럼 보였다. 움직이는 것은 안의 내용뿐이어야 한다.
      */}
      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[60] bg-background">
            <div className="flex h-full flex-col px-6">
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

              <nav className="flex flex-1 flex-col justify-center gap-2 pb-20">
                {NAV.map((item, i) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className="flex items-baseline gap-5 py-2 transition-all duration-300"
                      style={{
                        opacity: shown ? 1 : 0,
                        transform: shown ? "none" : "translateY(16px)",
                        transitionDelay: `${70 + i * 70}ms`,
                      }}
                    >
                      {/*
                      번호를 붙인다. 항목이 둘뿐이라 목록이라기보다 차례에 가깝고,
                      번호가 있으면 "여기 이것뿐이다"가 빈약함이 아니라 의도로 읽힌다.
                    */}
                      <span className="font-display text-[14px] font-bold tabular-nums text-accent">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        data-here={active || undefined}
                        className={`spark-line spark-line-lg font-display text-[46px] font-extrabold lowercase leading-none tracking-[-0.035em] ${
                          active ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div
                className="shrink-0 border-t border-hairline pb-6 pt-5 transition-all duration-300"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? "none" : "translateY(10px)",
                  transitionDelay: `${70 + NAV.length * 70}ms`,
                }}
              >
                {/* 목록만 덩그러니 두지 않는다 — 이 사이트가 무엇인지 한 줄로 말한다 */}
                <p className="text-[15px] text-muted">도전하고, 그 과정을 기록합니다.</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {SOCIAL.map((s) => {
                      const external = s.href.startsWith("http");
                      return (
                        <a
                          key={s.label}
                          href={s.href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-0.5 py-2 font-display text-[15px] font-semibold lowercase text-muted transition-colors hover:text-accent-text"
                        >
                          {s.label}
                          {external && <LinkIcon size={15} />}
                        </a>
                      );
                    })}
                  </div>
                  <ThemeToggle className="-mr-2" />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
