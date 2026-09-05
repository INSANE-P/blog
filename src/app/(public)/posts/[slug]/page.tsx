import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostArticle } from "@/features/posts/components/PostArticle";
import { getAdjacent, getBySlug } from "@/features/posts/queries";
import { entryHref } from "@/features/posts/types";
import { ArticleJsonLd } from "@/lib/seo/JsonLd";
import { lastModifiedOf } from "@/lib/seo/feed";
import { SITE } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getBySlug(slug);
  if (!entry) return { title: "이야기" };
  const description = entry.excerpt || undefined;
  const url = entryHref(entry);
  /*
    글에는 글에만 있는 것들을 붙인다 (ADR-0044).
    `type: "article"` 만으로는 언제 쓴 누구의 글인지 알 수 없어, 공유 카드와 검색 결과에
    날짜가 붙지 않는다. canonical 도 여기서 정해야 쿼리스트링이 붙은 주소가
    별개 페이지로 잡히지 않는다.
  */
  return {
    title: entry.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: entry.title,
      description,
      url,
      publishedTime: entry.publishedAt ?? `${entry.date}T00:00:00Z`,
      modifiedTime: lastModifiedOf(entry).toISOString(),
      authors: [SITE.author.name],
      ...(entry.tags?.length ? { tags: [...entry.tags] } : {}),
    },
  };
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [entry, adjacent] = await Promise.all([getBySlug(slug), getAdjacent(slug)]);
  if (!entry) notFound();
  return (
    <>
      <ArticleJsonLd entry={entry} />
      <PostArticle entry={entry} prev={adjacent.prev} next={adjacent.next} />
    </>
  );
}
