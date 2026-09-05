import { renderOg } from "@/features/posts/og";
import { formatDate } from "@/lib/utils/date";
import { getBySlug } from "@/features/posts/queries";

// 이야기 글별 소셜 공유 이미지 — 제목이 들어간다.
export const alt = "박찬빈의 글";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getBySlug(slug);
  return renderOg({
    title: entry?.title ?? "글",
    meta: entry?.date ? formatDate(entry.date) : undefined,
  });
}
