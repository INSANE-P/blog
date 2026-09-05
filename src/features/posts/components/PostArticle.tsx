import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { Markdown } from "@/lib/content/Markdown";
import { extractHeadings, readingMinutes } from "@/lib/content/headings";
import { formatDate } from "@/lib/utils/date";
import type { Entry } from "../types";
import { entryHref } from "../types";
import { ReadingProgress } from "./ReadingProgress";
import { Toc } from "./Toc";
import { StokeButton } from "./StokeButton";
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
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((t) => (
              <Link
                key={t}
                href={`/posts?tag=${encodeURIComponent(t)}`}
                className="rounded-lg bg-tint px-3 py-1.5 text-[13px] font-semibold text-accent-text"
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        <h1 className="mt-6 text-[32px] font-extrabold leading-[1.28] tracking-[-0.035em] sm:text-[42px]">
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
          반응 — 로그인 없이 남길 수 있는 유일한 자리.
          선을 긋지 않고 여백만으로 띄운다. 본문이 끝난 자리에 선을 그으면 "끝"이 먼저 읽혀서
          이어 읽기와 댓글이 덤처럼 보인다.
        */}
        <div className="mt-16 text-center">
          <StokeButton slug={entry.slug} initial={entry.stokes ?? 0} />
        </div>

        {/*
          아래 두 절은 홈과 같은 문법을 쓴다 — 영문 소문자 제목(ADR-0029).
          화면마다 제목 다는 방식이 다르면 한 사람이 만든 것으로 보이지 않는다.
        */}
        {(prev || next) && (
          <section className="mt-20 border-t border-hairline pt-12">
            <h2 className="font-display text-[26px] font-extrabold lowercase tracking-[-0.035em]">
              keep reading
            </h2>
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
