import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostCard } from "@/features/posts/components/PostCard";
import { getList, getTags } from "@/features/posts/queries";

export const metadata: Metadata = { title: "All posts" };

/**
 * 글 목록 (ADR-0025·0026).
 *
 * 홈과 같은 카드를 쓴다. 목록마다 다른 형태를 쓰면 같은 글이 화면마다 다른 것처럼 보인다.
 * 태그 필터는 URL 쿼리(?tag=)로 둬서 링크로 공유되고 뒤로 가기가 동작한다.
 * 검색·정렬은 글이 쌓인 뒤에 — 지금 넣으면 고를 것이 없는 도구만 남는다.
 */
export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const [posts, tags] = await Promise.all([getList(tag), getTags()]);

  const chips = [{ label: "전체", value: undefined }, ...tags.map((t) => ({ label: t, value: t }))];

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 pb-16 pt-16 sm:px-10 sm:pt-20">
      <h1 className="font-display text-[38px] font-extrabold lowercase tracking-[-0.04em] sm:text-[48px]">
        all posts
      </h1>

      {tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {chips.map((c) => {
            const active = c.value === tag;
            return (
              <Link
                key={c.label}
                href={c.value ? `/posts?tag=${encodeURIComponent(c.value)}` : "/posts"}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-[10px] bg-foreground px-4 py-2.5 text-[14px] font-semibold text-background"
                    : "rounded-[10px] border border-hairline px-4 py-2.5 text-[14px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-text"
                }
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      )}

      {posts.length > 0 ? (
        <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 sm:gap-y-[52px]">
          {posts.map((entry) => (
            <PostCard key={entry.slug} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            message={tag ? `'${tag}' 태그의 글은 아직 없어요` : "아직 글이 없어요"}
            hint={tag ? "다른 태그를 골라보세요" : "첫 글이 올라오면 여기에 모여요"}
          />
        </div>
      )}
    </div>
  );
}
