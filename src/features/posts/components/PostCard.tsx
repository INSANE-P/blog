import Link from "next/link";
import type { Entry } from "../types";
import { coverOf, entryHref } from "../types";

/** "2026-09-04" → "2026. 9. 4." */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${y}. ${Number(m)}. ${Number(d)}.`;
}

/**
 * 목록 카드 (ADR-0026).
 *
 * 커버를 제목 위에 크게 둔다. 오른쪽에 작은 썸네일을 붙이는 형태는 글이 수십 개
 * 쌓인 목록에서 한 화면에 더 많이 보여주려는 배치인데, 글이 적을 때 쓰면 목록이
 * 비어 보이고 각 글의 무게가 사라진다. 커버가 위에 있으면 글 하나가 하나의 대상이 된다.
 *
 * 커버가 없는 글도 자리 크기를 유지한다. 있는 글만 커지면 목록의 리듬이 깨지고,
 * 커버 유무가 곧 중요도로 잘못 읽힌다.
 */
export function PostCard({ entry }: { entry: Entry }) {
  const cover = coverOf(entry);

  return (
    <Link href={entryHref(entry)} className="group block">
      <div className="overflow-hidden rounded-[18px] bg-surface-hover">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            aria-hidden
            loading="lazy"
            className="aspect-[16/10] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          // 커버가 없으면 제목의 첫 글자를 크게 앉힌다 — 빈 회색 박스보다 글을 구별하기 쉽다
          <div className="flex aspect-[16/10] w-full items-center justify-center">
            <span className="font-display text-[64px] font-black uppercase text-muted/25">
              {entry.title.slice(0, 1)}
            </span>
          </div>
        )}
      </div>

      <h3 className="mt-[22px] line-clamp-2 text-[20px] font-bold leading-[1.4] tracking-[-0.028em] text-foreground transition-colors group-hover:text-accent-text sm:text-[22px]">
        {entry.title}
      </h3>

      {entry.excerpt && (
        <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-muted sm:text-[16px]">
          {entry.excerpt}
        </p>
      )}

      {/*
        태그는 상자가 아니라 한 줄 활자다(ADR-0035).
        카드에는 이미 둥근 커버가 있어서, 그 위에 작은 상자를 또 얹으면
        제목보다 상자가 먼저 눈에 들어온다. 대문자 자간으로 눕히면 제목이 주인공으로 남는다.
      */}
      <div className="mt-[18px] flex items-baseline gap-4">
        {entry.tags && entry.tags.length > 0 && (
          <span className="font-display text-[12px] font-bold uppercase tracking-[0.11em] text-muted">
            {entry.tags.join(" · ")}
          </span>
        )}
        <span className="ml-auto shrink-0 text-[14px] tabular-nums text-muted/75">
          {formatDate(entry.date)}
        </span>
      </div>
    </Link>
  );
}
