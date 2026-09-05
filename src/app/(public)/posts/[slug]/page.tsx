import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostArticle } from "@/features/posts/components/PostArticle";
import { getAdjacent, getBySlug, getList } from "@/features/posts/queries";
import { entryHref } from "@/features/posts/types";
import { ArticleJsonLd } from "@/lib/seo/JsonLd";
import { lastModifiedOf, publishedAtOf } from "@/lib/seo/feed";
import { SITE } from "@/lib/site";

/*
  캐시 주기 (ADR-0045).

  이 값은 신선도를 지키는 주된 수단이 **아니다.** 글이 바뀌는 경로는 노션 동기화 하나뿐이고,
  동기화가 끝나면 `revalidatePath` 가 즉시 캐시를 버린다. 그래서 이 값이 쓰이는 때는
  그 호출이 빠졌거나 실패했을 때, DB 를 손으로 고쳤을 때, 배포 직후 첫 요청뿐이다.

  즉 **"어긋났을 때 얼마 만에 스스로 회복하느냐"** 를 정하는 안전망이다.

  1시간으로 둔다. `false`(영구 캐시)는 동기화 쪽 버그 하나가 사이트를 영원히 굳게 만든다.
  ISR 은 만료돼도 사용자를 기다리게 하지 않고 옛 것을 주면서 뒤에서 다시 만들므로,
  짧게 잡아도 체감 손해가 없고 비용만 는다. 1시간이면 아무도 눈치채기 전에 회복된다.
*/
export const revalidate = 3600;

/*
  빌드 때 발행된 글을 미리 만들어 둔다 (ADR-0045).

  이게 없으면 첫 방문자가 올 때마다 그 글을 처음부터 만든다 — 크롤러가 그 첫 방문자인 경우가 많다.
  미리 만들어 두면 사람도 크롤러도 완성된 HTML 을 바로 받는다.

  목록에 없는 새 글도 계속 열린다. Next 는 기본으로 모르는 값을 만나면 그때 만들어 캐시한다
  (`dynamicParams` 기본값). 그래서 목록을 빌드 시점에 못 박아도 발행이 막히지 않는다.
*/
export async function generateStaticParams() {
  const entries = await getList();
  return entries.map((e) => ({ slug: e.slug }));
}

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
      publishedTime: publishedAtOf(entry).toISOString(),
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
