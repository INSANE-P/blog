/**
 * 섹션 머리말 (ADR-0024).
 *
 * 눈송이 모티프를 걷어내고 활자만 남겼다. 포트폴리오의 "LABEL -" 문법을 따른다 —
 * 대문자 자간을 벌린 작은 라벨 뒤에 하이픈 하나. 장식 아이콘을 쓰지 않는 이유는,
 * 강조 수단을 늘릴수록 정작 강조해야 할 것이 묻히기 때문이다(폰 레스토프 효과).
 */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
      {children} -
    </div>
  );
}
