/**
 * 빈 상태 — 방문자가 보는 화면이다. '관리자에게 지시하는 문구'가 아니라(예: "글을 등록하세요" ✗),
 * 방문자 시점의 차분한 안내를 보여준다(ADR-0005).
 *
 * 아이콘이나 일러스트를 두지 않는다. 빈 화면에 그림을 채우면 그 자리에 무언가 있다는
 * 착각만 주고, 활자만으로도 상태는 충분히 전달된다.
 */
export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-[15px] text-foreground">{message}</p>
      {hint && <p className="text-[13px] text-muted">{hint}</p>}
    </div>
  );
}
