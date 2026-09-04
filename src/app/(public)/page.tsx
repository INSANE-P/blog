import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PostRow } from "@/features/posts/components/PostRow";
import { getRecent } from "@/features/posts/queries";

/**
 * 홈 (ADR-0025).
 *
 * 홈을 전체 목록으로 만들지 않았다. 글이 적을 때는 그게 밀도 있어 보이지만,
 * 쌓이면 홈이 끝없는 목록이 되어 "이 사람이 누구인지"가 사라진다.
 * 그래서 최근 6편만 두고 전체 목록으로 가는 문을 연다.
 *
 * 6이라는 수는 작업 기억의 한계(밀러의 법칙, 7±2)에서 왔다.
 */
export default async function HomePage() {
  const recent = await getRecent(6);

  return (
    <div className="mx-auto max-w-3xl px-5">
      {/* 히어로 — 포트폴리오와 같은 아웃라인 워드마크 문법 */}
      <section className="pb-14 pt-24 sm:pt-28">
        <h1 className="font-display text-[clamp(2.6rem,9vw,4.5rem)] font-black uppercase leading-[0.95] tracking-tight">
          Park
          <br />
          <span className="stroke-text">Chanbin</span>
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-8 max-w-md text-[15px] leading-relaxed text-muted">
          개발하며 배운 것과 판단한 것을 쌓아둡니다.
          <br />
          왜 그렇게 만들었는지를 주로 씁니다.
        </p>
      </section>

      {/* 최근 글 */}
      <section className="border-t border-hairline pt-10">
        <div className="flex items-center justify-between">
          <SectionLabel>Recent</SectionLabel>
          <Link
            href="/posts"
            className="group inline-flex items-center gap-1 py-2 text-[13px] text-muted transition hover:text-foreground"
          >
            전체 보기
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {recent.length > 0 ? (
          <div className="mt-4">
            {recent.map((entry) => (
              <PostRow key={entry.slug} entry={entry} />
            ))}
          </div>
        ) : (
          <EmptyState message="아직 쌓인 글이 없어요" hint="곧 첫 글로 찾아뵐게요." />
        )}
      </section>
    </div>
  );
}
