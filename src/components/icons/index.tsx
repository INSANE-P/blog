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
  /* 기본은 1.5. 본문 글자 옆에 붙는 작은 아이콘만 예외로 굵힌다 */
  strokeWidth = 1.5,
  children,
}: IconProps & { strokeWidth?: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
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

/**
 * 사슬 — 링크.
 *
 * 고리 둘을 떼어 놓고 사이를 대각선으로 잇는다. 두 고리를 실제 사슬처럼 겹쳐 그렸더니
 * 13px 에서 획이 서로 닿아 덩어리가 됐다. 떼어 놓으면 작은 크기에서도 고리가 둘로 읽힌다.
 * 본문 글자 옆에 붙는 자리라 획을 1.8 로 조금 굵힌다 — 1.5 는 15px 아래에서 실처럼 흐려진다.
 */
export function LinkIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.8} {...props}>
      <path d="M9.9 14.1l4.2-4.2" />
      <path d="M11.6 7.7l1.5-1.5a3.9 3.9 0 0 1 5.5 5.5l-1.5 1.5" />
      <path d="M12.4 16.3l-1.5 1.5a3.9 3.9 0 0 1-5.5-5.5l1.5-1.5" />
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

/**
 * 메뉴 열기.
 *
 * 줄이 둘이다. 셋은 관습일 뿐 뜻이 없는데, 이 사이트의 내비는 항목이 정확히 둘이라
 * 아이콘이 그 사실을 그대로 말한다. 길이를 다르게 둔 것은 두 줄이 같으면 등호로 읽혀서다.
 */
export function Menu(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 9h16" />
      <path d="M4 15h10" />
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

/** 아래 꺾쇠 — 펼치기/접기. 열리면 180도 돌려 쓴다 */
export function ChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </Svg>
  );
}
