import Link from "next/link";
import { NAV } from "./nav";

const CHANNELS = [
  { label: "GitHub", href: "https://github.com/INSANE-P" },
  { label: "포트폴리오", href: "https://portfolio.chanbin.dev" },
  { label: "메일", href: "mailto:chanbin0626@gmail.com" },
];

/**
 * 푸터 (ADR-0026).
 *
 * 원형 아이콘 버튼을 걷어내고 글자 링크 목록으로 바꿨다. 아이콘만 있으면 어디로 가는지
 * 눌러 봐야 알고, 본문과 떨어져 떠 보인다. 갈 곳이 셋뿐이라 이름을 그대로 쓰는 편이 빠르다.
 *
 * 비어 있던 세로 공간은 실제로 존재하는 링크로 채웠다. 없는 메뉴로 열을 만들어
 * 규모를 꾸미지는 않는다 — 눌러서 아무 데도 가지 않는 링크가 가장 값싼 인상을 준다.
 */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline">
      <div className="mx-auto w-full max-w-[1080px] px-6 py-14 sm:px-10 sm:py-16">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between sm:gap-16">
          <div>
            <Link href="/" className="group inline-block">
              <span className="font-display text-[18px] font-black uppercase tracking-tight transition-colors group-hover:text-accent-text">
                CHANBIN<span className="text-accent-text">.</span>
              </span>
            </Link>
            <p className="mt-3 text-[14px] text-muted">도전하고, 그 과정을 기록합니다.</p>
            <p className="mt-6 text-[13px] text-muted/70">© {new Date().getFullYear()} 박찬빈</p>
          </div>

          <div className="flex gap-14 sm:gap-20">
            <FooterColumn
              title="둘러보기"
              items={NAV.map((n) => ({ label: n.label, href: n.href }))}
            />
            <FooterColumn title="채널" items={CHANNELS} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="text-[13px] font-bold tracking-tight text-foreground">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map(({ label, href }) => {
          const external = href.startsWith("http") || href.startsWith("mailto:");
          return (
            <li key={label}>
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="text-[14px] text-muted transition-colors hover:text-accent-text"
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
