/**
 * 아이콘 세트 (ADR-0024).
 *
 * 라이브러리를 쓰지 않고 직접 그린다. 라이브러리 아이콘은 굵기·여백·모서리 처리가
 * 제각각이라 몇 개만 섞어 써도 미세하게 어긋나는데, 규격을 하나로 정해 직접 그리면
 * 그 문제가 없고 번들에서 의존성 하나가 빠진다.
 *
 * 규격 — 이 파일의 모든 아이콘이 지킨다.
 *   - viewBox 24×24, 콘텐츠는 4~20 안에 그린다(사방 4px 여백)
 *   - stroke 1.5, fill 없음
 *   - stroke-linecap / linejoin: round
 *   - 색은 currentColor — 부모의 text-* 를 그대로 따른다
 *   - 크기는 size prop(기본 20). 부모 폰트 크기에 맞추려면 직접 넘긴다
 */

type IconProps = {
  size?: number;
  className?: string;
  /** 의미를 가진 아이콘이면 라벨을 준다. 없으면 장식으로 보고 숨긴다. */
  label?: string;
};

function Svg({
  size = 20,
  className,
  label,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  );
}

/** 왼쪽 화살표 — 뒤로 가기 */
export function ArrowLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </Svg>
  );
}

/** 오른쪽 화살표 — 다음, 더 보기 */
export function ArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  );
}

/** 오른쪽 위 화살표 — 외부 링크 */
export function ArrowUpRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </Svg>
  );
}

/** 봉투 — 메일 */
export function Mail(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </Svg>
  );
}

/** 문서 — 이력서, 글 */
export function FileText(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </Svg>
  );
}

/** 햄버거 — 모바일 메뉴 열기 */
export function Menu(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </Svg>
  );
}

/** 엑스 — 닫기 */
export function X(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Svg>
  );
}

/** 해 — 라이트 모드 */
export function Sun(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="M5.6 5.6l1.4 1.4" />
      <path d="M17 17l1.4 1.4" />
      <path d="M18.4 5.6L17 7" />
      <path d="M7 17l-1.4 1.4" />
    </Svg>
  );
}

/** 달 — 다크 모드 */
export function Moon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 13.5A8 8 0 0 1 10.5 4a7 7 0 1 0 9.5 9.5z" />
    </Svg>
  );
}

/** 겹친 네모 — 복사 */
export function Copy(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </Svg>
  );
}

/** 체크 — 복사 완료 */
export function Check(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Svg>
  );
}
