/**
 * 절 제목 (ADR-0032).
 *
 * 포트폴리오의 `Projects`·`Skills` 와 같은 장치다 — 속을 비운 대문자 활자.
 * 같은 사람이 만든 두 사이트가 같은 방식으로 절을 연다.
 *
 * 크기는 포트폴리오보다 두 단계 낮췄다(포폴 최대 104px → 여기 56px).
 * 포폴에서는 절 제목이 화면의 주인공이지만 여기서는 글이 주인공이다.
 * 72px 로 두었더니 히어로(76px)와 목소리가 거의 같아져 위계가 무너졌다.
 *
 * 획은 1px 이다. 2px 로 굵히면 또렷해지지만 포트폴리오의 얇고 단단한 결이 사라진다.
 * 30px 아래로 내려가면 획이 실처럼 가늘어져 형태가 흐려지므로 clamp 하한을 36px 로 둔다.
 *
 * 위에 구분선을 긋지 않는다. 이만한 활자가 놓이면 그 자체가 절의 시작을 말하고,
 * 선을 더하면 같은 말을 두 번 하는 셈이다. 사이는 여백으로 벌린다.
 */
export function SectionTitle({
  children,
  as: Tag = "h2",
}: {
  children: string;
  /** 페이지의 첫 제목이면 h1 로 — 화면에서 같은 모양이어도 문서 구조는 달라야 한다 */
  as?: "h1" | "h2";
}) {
  return (
    <Tag className="stroke-text font-display text-[clamp(2.25rem,4.5vw,3.5rem)] font-extrabold uppercase leading-none">
      {children}
    </Tag>
  );
}
