import Link from "next/link";
import type { Entry } from "../types";
import { coverOf, entryHref } from "../types";

// 태그 배지 — 너무 튀지 않되 가시성은 있게(옅은 틴트 + accent 톤 테두리/글씨)
const tagStyle = {
  background: "color-mix(in srgb, var(--accent) 8%, var(--surface))",
  borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
  color: "color-mix(in srgb, var(--accent) 52%, var(--foreground))",
};

/**
 * 목록 행 — 제목이 주인공인 텍스트 행. 대표 이미지가 있으면 오른쪽 썸네일로 끌어올리고,
 * 없으면 텍스트만. 목록에선 날짜를 숨기고(상세에서만 노출) 카테고리는 배지로.
 */
export function PostRow({ entry }: { entry: Entry }) {
  const cover = coverOf(entry);
  const hasMeta = (entry.tags?.length ?? 0) > 0;

  return (
    <Link
      href={entryHref(entry)}
      className="frost-rise group flex items-center gap-4 border-b border-hairline py-5 transition"
    >
      <div className="min-w-0 flex-1">
        <h3 className="text-[21px] font-bold leading-snug tracking-tight text-foreground transition group-hover:text-accent">
          {entry.title}
        </h3>
        <p className="mt-2.5 line-clamp-2 text-[15px] leading-relaxed text-muted">{entry.excerpt}</p>
        {hasMeta && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 font-display">
            {entry.tags?.map((t) => (
              <span
                key={t}
                className="rounded-md border px-2 py-0.5 text-[11px] font-medium"
                style={tagStyle}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt=""
          aria-hidden
          className="hidden h-[72px] w-[112px] shrink-0 self-center rounded-lg border border-border object-cover sm:block"
          loading="lazy"
        />
      )}
    </Link>
  );
}
