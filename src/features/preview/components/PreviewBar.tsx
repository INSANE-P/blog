import Link from "next/link";

/**
 * 미리보기 띠 (ADR-0061).
 *
 * 화면 아래에 떠 있다. 글 위에 두면 본문이 밀려 발행했을 때와 다른 자리에서 시작한다.
 * 미리 보는 이유가 "똑같이 보이는지"이므로, 띠는 글의 흐름 밖에 둔다.
 *
 * 발행하면 걸릴 것(슬러그 없음, 모르는 서식)이 있으면 여기에 적는다.
 * 그걸 발행한 뒤에 알면 늦다.
 */
export function PreviewBar({
  published,
  warnings = [],
}: {
  published?: boolean;
  warnings?: string[];
}) {
  return (
    <aside
      aria-label="미리보기"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[560px] rounded-2xl border border-hairline bg-background/95 px-4 py-3 text-[13px] shadow-sm backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-accent-text">
          미리보기
          {published !== undefined && (
            <span className="ml-2 font-medium text-muted">
              {published ? "발행된 글" : "발행 전"}
            </span>
          )}
        </span>
        <span className="flex items-center gap-3 text-muted">
          <Link href="/preview" className="hover:text-foreground">
            목록
          </Link>
          {/* 쿠키를 지우는 주소라 미리 불러오면 안 된다 */}
          <Link href="/api/preview/exit" prefetch={false} className="hover:text-foreground">
            끝내기
          </Link>
        </span>
      </div>
      {warnings.length > 0 && (
        <ul className="mt-2 space-y-1 text-muted">
          {warnings.map((w) => (
            <li key={w}>· {w}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}
