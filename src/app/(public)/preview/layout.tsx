import type { Metadata } from "next";

/**
 * 미리보기 영역 (ADR-0061).
 *
 * 검색엔진이 이 주소를 알게 될 길은 거의 없다. 사이트맵에 없고, 쿠키가 없으면 404 다.
 * 그래도 혹시 링크가 새서 들어온 경우를 위해 겹으로 막는다. 여기서 거는 robots 메타와
 * 응답 헤더의 X-Robots-Tag(next.config) 둘이다.
 *
 * robots.txt 로는 막지 않는다. 막으면 크롤러가 주소를 열어 보지 않아서 404 와 noindex 를
 * 못 보고, 링크가 샜을 때 내용 없이 주소만 색인될 수 있다. 열어 보고 404 를 받게 두는 편이 확실하다.
 *
 * 잠금(쿠키 확인)은 레이아웃이 아니라 각 페이지에서 한다. 레이아웃은 화면을 옮겨 다닐 때
 * 다시 그려지지 않을 수 있어서, 막는 일을 맡기기에 믿을 만한 자리가 아니다.
 */
export const metadata: Metadata = {
  title: "미리보기",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
