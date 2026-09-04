import Link from "next/link";
import { Mail } from "@/components/icons";
import { GithubIcon } from "@/components/ui/GithubIcon";

const SOCIAL: {
  label: string;
  href: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { label: "GitHub", href: "https://github.com/INSANE-P", Icon: GithubIcon },
  { label: "메일", href: "mailto:chanbin0626@gmail.com", Icon: Mail },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline">
      <div className="mx-auto max-w-3xl px-5 py-12">
        {/* 둘러보기는 sticky 헤더가 대신하므로, 푸터는 이름(좌) + 소셜(우)만 */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <Link href="/" className="group">
              <span className="font-display text-base font-extrabold uppercase tracking-tight">
                <span className="stroke-text stroke-hover-accent transition-all">CHANBIN</span>
                <span className="text-accent">.</span>
              </span>
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              개발하며 배운 것과 판단한 것을 쌓아둡니다.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {SOCIAL.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex size-9 items-center justify-center rounded-full border border-hairline text-muted transition hover:border-accent hover:text-accent"
              >
                <Icon size={18} className="size-[18px]" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-hairline pt-6 text-xs text-muted">© 박찬빈</div>
      </div>
    </footer>
  );
}
