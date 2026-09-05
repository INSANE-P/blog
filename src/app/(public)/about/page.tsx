import type { Metadata } from "next";
import { ArrowUpRight } from "@/components/icons";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { COLOPHON, IDENTITY, INTRO, NOW, WRITING } from "./data";

export const metadata: Metadata = { title: "About" };

/**
 * 소개 (ADR-0038).
 *
 * 읽는 화면이라 본문과 같은 폭을 쓴다. 이전에는 1080px 에 칩과 카드를 늘어놓은
 * 훑는 화면이었는데, 그건 포트폴리오가 하는 일이었다.
 *
 * 기술 스택·프로젝트·수상을 걷어내고 사람 이야기만 남겼다.
 * "지금" 절이 이 페이지의 핵심이다 — 포트폴리오는 완결된 성과를 보여주는 곳이라
 * 시간이 멈춰 있지만, 여기서는 지금 무엇을 하는 사람인지 말할 수 있다.
 */
export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--container-prose)] px-6 pb-8 pt-16 sm:pt-20">
      <SectionTitle as="h1">about</SectionTitle>

      {/*
        명함. 이름과 갈 곳을 한 상자에 모은다.
        흩어 두면 "연락처" 절을 따로 만들어야 하는데, 위에 모으면 처음 온 사람이
        누구이고 어디로 가면 되는지를 먼저 안다.
      */}
      <section className="mt-10 rounded-[18px] bg-surface-hover px-6 py-6 sm:px-7">
        <p className="text-[20px] font-bold tracking-[-0.02em]">
          {IDENTITY.name}
          <span className="ml-2.5 font-display text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
            {IDENTITY.nameEn}
          </span>
        </p>
        <p className="mt-1.5 text-[15px] text-muted">
          {IDENTITY.role} · {IDENTITY.affiliation}
        </p>

        <ul className="mt-5 flex flex-col gap-2.5 border-t border-hairline pt-5">
          {IDENTITY.links.map(({ label, value, href }) => (
            <li key={label} className="flex items-baseline gap-4">
              <span className="w-[74px] shrink-0 font-display text-[12px] font-bold uppercase tracking-[0.11em] text-muted">
                {label}
              </span>
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group inline-flex min-w-0 items-center gap-1 text-[15px] transition-colors hover:text-accent-text"
              >
                <span className="spark-line truncate">{value}</span>
                {href.startsWith("http") && <ArrowUpRight size={14} className="shrink-0" />}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="prose mt-12">
        {INTRO.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <section className="mt-20">
        <div className="flex items-baseline justify-between gap-5">
          <SectionTitle>now</SectionTitle>
          {/* 시간이 지나면 바뀌는 절이라 기준 시점을 밝힌다 — 갱신을 깜빡해도 정직하다 */}
          <span className="shrink-0 text-[14px] text-muted">{NOW.asOf} 기준</span>
        </div>

        <dl className="mt-9 flex flex-col gap-8">
          {NOW.items.map(({ label, body }) => (
            <div key={label}>
              <dt className="text-[15px] font-bold text-accent-text">{label}</dt>
              <dd className="mt-2 text-[17px] leading-[1.75] text-prose-fg">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-20">
        <SectionTitle>writing</SectionTitle>
        <div className="prose mt-9">
          {WRITING.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <SectionTitle>colophon</SectionTitle>
        <ul className="mt-9 flex flex-col gap-3.5">
          {COLOPHON.lines.map((line) => (
            <li key={line} className="flex gap-3 text-[17px] leading-[1.75] text-prose-fg">
              <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-accent" />
              {line}
            </li>
          ))}
        </ul>
        <a
          href={COLOPHON.repo.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-7 inline-flex items-center gap-1.5 font-display text-[15px] font-semibold lowercase text-muted transition-colors hover:text-accent-text"
        >
          <span className="spark-line">{COLOPHON.repo.label}</span>
          <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5" />
        </a>
      </section>
    </div>
  );
}
