import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { Markdown } from "@/lib/content/Markdown";
import { formatDate } from "@/lib/utils/date";
import type { Entry } from "../types";
import { entryHref } from "../types";
import { StokeButton } from "./StokeButton";
import { Comments } from "./Comments";

/** 글쓴이 아바타 — 직접 그린 공룡 캐릭터. 얼음 톤 배경 위에 캐릭터 전체가 보이게 contain. */
function DinoAvatar({ size }: { size: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{ width: size, height: size, background: "linear-gradient(150deg,#e8f7fe,#cfeaf6)" }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/dino.png"
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

/**
 * 이야기·기록 공유 상세(에디토리얼). 기록은 type만 다르고 같은 레이아웃을 쓴다(ADR-0005).
 * 본문은 임시로 mock HTML을 렌더 — Supabase 연결 시 Tiptap JSON 렌더로 교체.
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
  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      {/* 뒤로가기 — 상세에선 텍스트 없이 큰 화살표만 */}
      <Link
        href="/posts"
        aria-label="글 목록으로 돌아가기"
        className="-ml-2 inline-flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-accent"
      >
        <ArrowLeft className="size-6" aria-hidden />
      </Link>

      <h1 className="mt-6 text-[31px] font-bold leading-tight tracking-tight text-foreground">
        {entry.title}
      </h1>
      <p className="mt-4 text-[17px] leading-relaxed text-muted">{entry.excerpt}</p>

      <div className="mt-6 flex items-center gap-3 border-b border-border pb-6">
        <DinoAvatar size={40} />
        <div className="text-sm">
          <div className="font-semibold text-foreground">박찬빈</div>
          <div className="mt-0.5 font-display text-[13px] text-muted">{formatDate(entry.date)}</div>
        </div>
      </div>

      {/* 대표(커버) 이미지 — 명시한 경우 본문 앞 리드 이미지로 */}
      {entry.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.coverImage}
          alt=""
          aria-hidden
          className="mt-9 aspect-[1200/630] w-full rounded-2xl border border-border object-cover"
        />
      )}

      <div className="prose mt-9">
        <Markdown>{entry.body ?? ""}</Markdown>
      </div>

      {/* 반응 — "불 지피기" */}
      <div className="mt-12 border-t border-border pt-8 text-center">
        <p className="mb-4 text-sm text-muted">이 글이 좋았다면, 불을 지펴주세요</p>
        <StokeButton slug={entry.slug} initial={entry.stokes ?? 0} />
      </div>

      {/* 댓글 — Giscus(GitHub Discussions) */}
      <div className="mt-14 border-t border-border pt-8">
        <Comments />
      </div>

      {/* 이전 / 다음 — 같은 흐름 안에서 이어 읽기. 두 카드 모두 좌측 정렬로 통일 */}
      {(prev || next) && (
        <nav className="mt-12 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              href={entryHref(prev)}
              className="frost-rise group flex flex-col rounded-xl border border-border p-4 transition"
            >
              <span className="inline-flex items-center gap-1.5 font-display text-xs text-muted">
                <ArrowLeft
                  className="size-3.5 transition group-hover:-translate-x-0.5"
                  aria-hidden
                />
                이전 글
              </span>
              <span className="mt-2 line-clamp-1 font-semibold text-foreground transition group-hover:text-accent">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {next ? (
            <Link
              href={entryHref(next)}
              className="frost-rise group flex flex-col rounded-xl border border-border p-4 transition"
            >
              <span className="inline-flex items-center gap-1.5 font-display text-xs text-muted">
                다음 글
                <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
              <span className="mt-2 line-clamp-1 font-semibold text-foreground transition group-hover:text-accent">
                {next.title}
              </span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
        </nav>
      )}

      {/* 다 읽고 나서 목록으로 */}
      <div className="mt-10 border-t border-hairline pt-8">
        <Link
          href="/posts"
          className="group inline-flex items-center gap-2 text-base font-semibold text-foreground transition hover:text-accent"
        >
          <ArrowLeft className="size-5 transition group-hover:-translate-x-0.5" aria-hidden />
          글 목록으로
        </Link>
      </div>
    </article>
  );
}
