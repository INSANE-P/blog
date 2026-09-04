import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostRow } from "@/features/posts/components/PostRow";
import { getList, getTags } from "@/features/posts/queries";

export const metadata: Metadata = { title: "이야기" };

/** 이야기 목록 — 태그 필터는 URL 쿼리(?tag=)로. RSC에서 필터된 결과를 직접 조회. */
export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const [posts, tags] = await Promise.all([getList(tag), getTags()]);

  const chips = [{ label: "전체", value: undefined }, ...tags.map((t) => ({ label: t, value: t }))];

  return (
    <div className="mx-auto max-w-3xl px-5 pb-12 pt-20">
      <h1 className="text-[34px] font-bold tracking-tight text-foreground">이야기</h1>
      <p className="mt-3 text-base text-muted">기술부터 잡다한 생각까지.</p>

      {/* 태그 필터 (검색·정렬은 글이 쌓이면 — YAGNI) */}
      <div className="mt-7 flex flex-wrap gap-2">
        {chips.map((c) => {
          const active = c.value === tag;
          return (
            <Link
              key={c.label}
              href={c.value ? `/posts?tag=${encodeURIComponent(c.value)}` : "/posts"}
              className={
                active
                  ? "rounded-full px-3.5 py-1.5 font-display text-[13px] font-medium text-white"
                  : "frost-rise rounded-full border border-border px-3.5 py-1.5 font-display text-[13px] text-muted hover:text-foreground"
              }
              style={active ? { background: "var(--accent)" } : undefined}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {posts.length > 0 ? (
        <div className="mt-8 border-t border-hairline">
          {posts.map((entry) => (
            <PostRow key={entry.slug} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            message={tag ? `'${tag}' 이야기는 아직 없어요` : "아직 이야기가 없어요"}
            hint={tag ? "다른 태그를 골라보세요" : "첫 이야기가 올라오면 여기에 모여요"}
          />
        </div>
      )}
    </div>
  );
}
