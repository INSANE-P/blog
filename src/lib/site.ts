/**
 * 사이트의 신원 (ADR-0044).
 *
 * 주소를 한 곳에서만 정한다. 예전에는 `layout.tsx` 안에만 있었는데,
 * 사이트맵·robots·구조화 데이터·RSS 가 전부 같은 주소를 알아야 한다.
 * 네 곳이 각자 기본값을 들고 있으면 배포 도메인이 바뀔 때 한 곳이 반드시 남는다.
 *
 * 커스텀 도메인이 생기면 Vercel 환경변수 `NEXT_PUBLIC_SITE_URL` 만 바꾸면 된다.
 * 이 값이 실제 도메인과 다르면 canonical 과 OG 절대경로가 전부 어긋나므로,
 * 배포 뒤에 한 번은 눈으로 확인해야 한다.
 */
export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://frost-log.vercel.app").replace(/\/$/, ""),
  name: "박찬빈",
  /** 검색 결과와 공유 카드에 함께 나가는 한 줄 */
  description: "도전하고, 그 과정을 기록합니다. 박찬빈의 개인 블로그.",
  locale: "ko_KR",
  lang: "ko",
  author: {
    name: "박찬빈",
    url: "https://github.com/INSANE-P",
  },
} as const;

/** 상대 경로를 절대 주소로. canonical·사이트맵·RSS 가 쓴다 */
export function absolute(path: string): string {
  return path.startsWith("http") ? path : `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
