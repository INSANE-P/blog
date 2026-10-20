import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PreviewBar } from "@/features/preview/components/PreviewBar";
import { listForPreview } from "@/features/preview/queries";
import { formatDate } from "@/lib/utils/date";

/**
 * 미리보기 목록 (ADR-0061).
 *
 * 노션 데이터베이스의 글을 최근에 고친 순서로 보여 준다. 발행한 글도 함께 둔다.
 * 고치는 중인 글이 꼭 발행 전인 것만은 아니다.
 */
export const dynamic = "force-dynamic";

export default async function PreviewListPage() {
  if (!(await draftMode()).isEnabled) notFound();
  const items = await listForPreview();

  return (
    <section className="mx-auto w-full max-w-[var(--container-prose)] px-6 pb-32 pt-12 sm:pt-16">
      <SectionTitle>preview</SectionTitle>
      <p className="mt-2 text-[15px] text-muted">
        노션에서 고친 내용이 바로 보여요. 발행 체크는 노션에서 해요.
      </p>

      {items.length === 0 ? (
        <EmptyState message="노션 데이터베이스에 글이 없어요." />
      ) : (
        <ul className="mt-8 divide-y divide-hairline border-y border-hairline">
          {items.map((item) => (
            <li key={item.pageId}>
              <Link
                href={`/preview/${item.pageId}`}
                className="flex items-baseline justify-between gap-4 py-4 transition-colors hover:text-accent-text"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-bold">
                    {item.title || "(제목 없음)"}
                  </span>
                  <span className="mt-1 block text-[13px] text-muted">
                    {item.date ? formatDate(item.date) : "날짜 없음"}
                    {!item.slug && " · 슬러그 없음"}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] text-muted">
                  {item.published ? "발행됨" : "발행 전"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <PreviewBar />
    </section>
  );
}
