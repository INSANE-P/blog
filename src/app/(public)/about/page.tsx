import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail } from "@/components/icons";
import { GithubIcon } from "@/components/ui/GithubIcon";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { AWARDS, PROJECTS, STACK } from "./data";

export const metadata: Metadata = { title: "소개" };

// 옅은 틴트 + accent 톤 — 목록의 태그 배지와 같은 언어(일관성)
const chipStyle = {
  background: "color-mix(in srgb, var(--accent) 8%, var(--surface))",
  borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
  color: "color-mix(in srgb, var(--accent) 52%, var(--foreground))",
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-md border px-2 py-0.5 font-display text-[11px] font-medium"
      style={chipStyle}
    >
      {children}
    </span>
  );
}

/** 외부 링크 칩 — 라벨 + 살짝 떠오르는 화살표. 모두 새 탭. */
function LinkChip({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-0.5 font-display text-[13px] font-medium text-muted transition hover:text-accent"
    >
      {label}
      <ArrowUpRight
        className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        aria-hidden
      />
    </a>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 pb-4 pt-16 sm:px-10 sm:pt-20">
      {/* 인트로 — 이름 + 한 문단 + 마스코트(사진 대신) */}
      <section className="flex flex-col-reverse items-start gap-7 sm:flex-row sm:items-center sm:gap-9">
        <div className="min-w-0 flex-1">
          <h1 className="text-[30px] font-bold tracking-tight text-foreground">
            안녕하세요, <span className="text-accent">박찬빈</span>이에요
          </h1>
          <p className="mt-2 font-display text-sm text-muted">
            프론트엔드 개발자 · 세종대학교 컴퓨터공학과
          </p>
          <p className="mt-5 break-keep text-[15px] leading-relaxed text-foreground/90">
            팀에서 <span className="font-semibold text-accent">같이 만들어가는 과정</span>을 좋아하는
            프론트엔드 개발자예요. 더 나은 방법이 보이면 먼저 제안하고, 필요하면 새로운 것도 마다하지
            않고 시도해요. 재밌어 보이는 걸 만들고, 생각이 향하는 대로 움직여요.
          </p>
        </div>

        {/* 설화를 안은 공룡 — 다른 화면과 같은 캐릭터로 톤을 맞춘다 */}
      </section>

      {/* 기술 */}
      <section className="mt-16 border-t border-border pt-10">
        <SectionLabel>기술</SectionLabel>
        <dl className="mt-6 flex flex-col gap-4">
          {STACK.map(({ label, items }) => (
            <div key={label} className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-5">
              <dt className="w-24 shrink-0 font-display text-[13px] font-medium text-muted">
                {label}
              </dt>
              <dd className="flex flex-wrap gap-1.5">
                {items.map((it) => (
                  <Tag key={it}>{it}</Tag>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 프로젝트 */}
      <section className="mt-16 border-t border-border pt-10">
        <SectionLabel>프로젝트</SectionLabel>
        <div className="mt-7 flex flex-col gap-10">
          {PROJECTS.map((p) => (
            <article key={p.name}>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h3 className="text-[20px] font-bold tracking-tight text-foreground">{p.name}</h3>
                {p.status && (
                  <span className="inline-flex items-center gap-1.5 font-display text-[12px] text-muted">
                    <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                    {p.status}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[14px] text-muted">{p.tagline}</p>
              <p className="mt-1 font-display text-[12px] text-muted">
                {p.period} · {p.role}
              </p>

              <ul className="mt-4 flex flex-col gap-2">
                {p.points.map((pt) => (
                  <li
                    key={pt}
                    className="flex gap-2.5 text-[14px] leading-relaxed text-foreground/90"
                  >
                    <span
                      className="mt-2 size-1 shrink-0 rounded-full"
                      style={{ background: "color-mix(in srgb, var(--accent) 55%, transparent)" }}
                      aria-hidden
                    />
                    {pt}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tech.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {p.links.map((l) => (
                  <LinkChip key={l.label} label={l.label} href={l.href} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 활동 */}
      <section className="mt-16 border-t border-border pt-10">
        <SectionLabel>활동</SectionLabel>
        <article className="mt-7">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h3 className="text-[20px] font-bold tracking-tight text-foreground">그리디 (Greedy)</h3>
            <span className="font-display text-[12px] text-muted">2025.03 ~ 현재</span>
          </div>
          <p className="mt-1.5 text-[14px] text-muted">
            세종대학교 SW 학술 동아리 · 2기 멘티 → 3기 스터디 리드 → 4기 메인테이너
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {[
              "스터디 리드로 상태관리 미션을 Zustand·TanStack Query 기반으로 재설계 (3기)",
              "메인테이너로 새 미션 설계 및 학습 자료 제작 (4기)",
            ].map((pt) => (
              <li key={pt} className="flex gap-2.5 text-[14px] leading-relaxed text-foreground/90">
                <span
                  className="mt-2 size-1 shrink-0 rounded-full"
                  style={{ background: "color-mix(in srgb, var(--accent) 55%, transparent)" }}
                  aria-hidden
                />
                {pt}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <LinkChip
              label="스터디 소개 발표 자료"
              href="https://insane-p.github.io/greedy-frontend-study/"
            />
          </div>
        </article>
      </section>

      {/* 수상 */}
      <section className="mt-16 border-t border-border pt-10">
        <SectionLabel>수상</SectionLabel>
        <ul className="mt-6 flex flex-col gap-5">
          {AWARDS.map((a) => (
            <li key={a.title}>
              <div className="text-[15px] font-semibold text-foreground">{a.title}</div>
              <div className="mt-1 font-display text-[12px] text-muted">{a.by}</div>
              <div className="mt-0.5 text-[13px] text-muted">{a.note}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* 연락처 */}
      <section className="mt-16 border-t border-border pt-10">
        <SectionLabel>연락처</SectionLabel>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/INSANE-P"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 font-display text-[13px] font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            <GithubIcon className="size-[17px]" />
            GitHub
          </a>
          <a
            href="mailto:chanbin0626@gmail.com"
            className="inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 font-display text-[13px] font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            <Mail className="size-[17px]" />
            메일
          </a>
          <Link
            href="/resume"
            className="inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 font-display text-[13px] font-medium text-muted transition hover:border-accent hover:text-accent"
          >
            이력서
            <span className="font-display text-[11px] text-accent">준비중</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
