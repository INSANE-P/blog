import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PostCard } from "@/features/posts/components/PostCard";
import { getRecent } from "@/features/posts/queries";

/**
 * 홈 (ADR-0025·0026).
 *
 * 홈을 전체 목록으로 만들지 않았다. 글이 적을 때는 그게 밀도 있어 보이지만,
 * 쌓이면 홈이 끝없는 목록이 되어 "이 사람이 누구인지"가 사라진다.
 * 그래서 최근 6편만 두고 전체 목록으로 가는 문을 연다(밀러의 법칙, 7±2).
 *
 * 섹션 제목은 영문 소문자다(ADR-0029). 사이트의 구조를 가리키는 말이라 표지에 속한다 —
 * 소개 페이지의 "기술"·"프로젝트"처럼 글의 내용을 가리키는 말은 한글로 남는다.
 */
export default async function HomePage() {
  const recent = await getRecent(6);

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 sm:px-10">
      {/* 히어로 — 포트폴리오와 같은 아웃라인 워드마크 문법 */}
      <section className="pb-14 pt-20 sm:pb-[72px] sm:pt-[88px]">
        <h1 className="font-display text-[clamp(3rem,8vw,5.4rem)] font-black uppercase leading-[0.93] tracking-[-0.035em]">
          Park
          <br />
          <span className="stroke-text stroke-text-thick">Chanbin</span>
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-7 text-[18px] font-medium tracking-[-0.02em] text-muted sm:text-[21px]">
          도전하고, 그 과정을 기록합니다.
        </p>
      </section>

      {/* 최근 글 — 제목은 표지라 영문 소문자다(ADR-0029) */}
      <section className="pt-20 sm:pt-24">
        <div className="mb-9 flex items-end justify-between gap-6 sm:mb-10">
          <SectionTitle>new</SectionTitle>
          <Link
            href="/posts"
            className="group inline-flex shrink-0 items-center gap-1.5 font-display text-[15px] font-semibold lowercase text-muted transition-colors hover:text-accent-text sm:text-[16px]"
          >
            <span className="spark-line">all posts</span>
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {recent.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 sm:gap-y-[52px]">
            {recent.map((entry) => (
              <PostCard key={entry.slug} entry={entry} />
            ))}
          </div>
        ) : (
          <EmptyState message="아직 쌓인 글이 없어요" hint="곧 첫 글로 찾아뵐게요." />
        )}
      </section>
    </div>
  );
}
