import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PostCard } from "@/features/posts/components/PostCard";
import { getList } from "@/features/posts/queries";

/*
  설명을 따로 적는다 (ADR-0044). 안 적으면 사이트 기본 설명을 물려받아
  홈·목록·소개 셋이 검색 결과에 똑같은 문장으로 나온다 — 어느 것을 눌러야 할지 알 수 없다.
*/
export const metadata: Metadata = {
  title: "Posts",
  description: "박찬빈이 쓴 글 전부입니다. 만들다 막힌 것, 팀에서 벌인 일, 그냥 하루를 씁니다.",
  alternates: { canonical: "/posts" },
};

/**
 * 글 목록 (ADR-0025·0026·0034).
 *
 * 홈과 같은 카드를 쓴다. 목록마다 다른 형태를 쓰면 같은 글이 화면마다 다른 것처럼 보인다.
 *
 * 태그 필터를 걷어냈다. 글이 몇 편일 때 필터는 고를 것이 없는 도구만 화면에 남기고,
 * 이 사이트의 화면은 한 번에 한 가지만 한다. 태그는 "무슨 글인지" 알려주는 표시로만 남는다.
 */
export default async function PostsPage() {
  const posts = await getList();

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 pb-16 pt-16 sm:px-10 sm:pt-20">
      <SectionTitle as="h1">posts</SectionTitle>

      {posts.length > 0 ? (
        <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 sm:gap-y-[52px]">
          {posts.map((entry) => (
            <PostCard key={entry.slug} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState message="아직 글이 없어요" hint="첫 글이 올라오면 여기에 모여요" />
        </div>
      )}
    </div>
  );
}
