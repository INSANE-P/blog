import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Markdown } from "@/lib/content/Markdown";
import { extractHeadings, readingMinutes } from "@/lib/content/headings";
import { formatDate } from "@/lib/utils/date";
import type { Entry } from "../types";
import { entryHref } from "../types";
import { ReadingProgress } from "./ReadingProgress";
import { Toc } from "./Toc";
import { Comments } from "./Comments";

/**
 * 글 상세 (ADR-0025·0027).
 *
 * 요약을 다시 보여 주지 않는다. 요약은 목록 카드와 공유 미리보기를 위해 있는 것이고,
 * 이미 눌러서 들어온 사람에게는 첫 문장까지 가는 길만 길어진다.
 *
 * 다 읽은 직후가 이탈이 가장 큰 순간이라, 끝에 다음 글을 권한다(피크엔드 법칙).
 */
export function PostArticle({
  entry,
  prev,
  next,
}: {
  entry: Entry;
  prev?: Entry | null;
  next?: Entry | null;
}) {
  const body = entry.body ?? "";
  const headings = extractHeadings(body);

  return (
    <>
      <ReadingProgress />

      <article className="mx-auto w-full max-w-[var(--container-prose)] px-6 pb-4 pt-12 sm:pt-16">
        {/*
          돌아가기 링크를 두지 않는다.
          깊이가 목록 → 글 두 단계뿐이라 되돌아갈 길은 붙박이 헤더의 posts 하나로 충분하고,
          글 맨 위에 있어 봐야 읽기 시작하기 전에 나가는 문부터 보게 만든다.
          다 읽은 뒤의 갈 곳은 아래 이어 읽기가 맡는다.
        */}
        {/*
          제목 위 커커. 목록 카드와 같은 활자다 — 같은 정보가 화면마다 다른 모양이면
          같은 것으로 읽히지 않는다. 누를 수는 없다(필터를 걷어냈으므로, ADR-0034).
        */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="font-display text-[12px] font-bold uppercase tracking-[0.11em] text-muted">
            {entry.tags.join(" · ")}
          </div>
        )}

        <h1 className="mt-4 text-[32px] font-extrabold leading-[1.28] tracking-[-0.035em] sm:text-[42px]">
          {entry.title}
        </h1>

        <div className="mt-5 flex items-center gap-2.5 border-b border-hairline pb-7 text-[14px] text-muted">
          <span className="font-bold text-foreground">박찬빈</span>
          <Dot />
          <time dateTime={entry.date}>{formatDate(entry.date)}</time>
          <Dot />
          <span>{readingMinutes(body)}분</span>
        </div>

        {entry.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.coverImage}
            alt=""
            aria-hidden
            className="mt-9 aspect-[16/9] w-full rounded-2xl border border-hairline bg-surface-hover object-cover"
          />
        )}

        <Toc headings={headings} />

        <div className="prose mt-11">
          <Markdown>{body}</Markdown>
        </div>

        {/*
          아래 두 절은 홈·목록과 같은 절 제목을 쓴다(ADR-0032·0035).
          본문이 끝난 뒤에 오므로 읽기를 끊지 않고, 같은 제목을 쓰면 한 사이트로 읽힌다.
        */}
        {(prev || next) && (
          <section className="mt-16 border-t border-hairline pt-12">
            <SectionTitle>keep reading</SectionTitle>
            <nav className="mt-7 grid gap-3 sm:grid-cols-2">
              <Adjacent entry={prev} direction="prev" />
              <Adjacent entry={next} direction="next" />
            </nav>
          </section>
        )}

        <div className="mt-20 border-t border-hairline pt-12">
          <Comments />
        </div>
      </article>
    </>
  );
}

function Dot() {
  return <span aria-hidden className="size-[3px] rounded-full bg-muted/60" />;
}

function Adjacent({
  entry,
  direction,
}: {
  entry?: Entry | null;
  direction: "prev" | "next";
}) {
  if (!entry) return <span className="hidden sm:block" />;
  const isPrev = direction === "prev";
  return (
    <Link
      href={entryHref(entry)}
      className="group flex flex-col rounded-2xl border border-hairline p-5 transition-colors hover:border-accent/40 hover:bg-surface-hover"
    >
      <span className="inline-flex items-center gap-1.5 font-display text-[13px] font-semibold lowercase text-muted">
        {isPrev && (
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
        )}
        {isPrev ? "previous" : "next"}
        {!isPrev && (
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        )}
      </span>
      <span className="mt-2.5 line-clamp-2 text-[17px] font-bold leading-snug tracking-tight transition-colors group-hover:text-accent-text">
        {entry.title}
      </span>
    </Link>
  );
}
