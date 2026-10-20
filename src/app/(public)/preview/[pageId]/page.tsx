import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { PostArticle } from "@/features/posts/components/PostArticle";
import { PreviewBar } from "@/features/preview/components/PreviewBar";
import { getPreview } from "@/features/preview/queries";

/**
 * 글 미리보기 (ADR-0061).
 *
 * 공개 글 화면과 같은 `PostArticle` 로 그린다. 다른 컴포넌트로 비슷하게 그리면
 * 미리보기와 실제 화면이 조금씩 어긋나기 시작하고, 그러면 미리보기를 믿을 수 없다.
 *
 * 구조화 데이터, canonical, 공유 카드는 붙이지 않는다. 검색엔진에 알릴 글이 아니다.
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ pageId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  if (!(await draftMode()).isEnabled) return {};
  const { pageId } = await params;
  const preview = await getPreview(pageId);
  return { title: preview ? `미리보기 · ${preview.entry.title}` : "미리보기" };
}

export default async function PreviewPostPage({ params }: Params) {
  if (!(await draftMode()).isEnabled) notFound();
  const { pageId } = await params;
  const preview = await getPreview(pageId);
  if (!preview) notFound();

  return (
    <>
      <PostArticle entry={preview.entry} preview />
      <PreviewBar published={preview.published} warnings={preview.warnings} />
    </>
  );
}
