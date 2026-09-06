import type { Metadata } from "next";
import { pretendard } from "./fonts";
import { SITE } from "@/lib/site";
import "./globals.css";

/*
  사이트 이름은 "설화"에서 사람 이름으로 바꿨다가(ADR-0024),
  다시 "개발자 찬빈"으로 옮겼다(ADR-0055).

  이름만 있으면 이미 나를 아는 사람만 알아본다. 검색 결과의 첫 줄이 여기서 나오는데,
  거기서 이곳이 무엇인지 말하지 못하면 들어올 이유가 생기지 않는다.

  홈만 `title` 을 쓴다 — "개발자 찬빈의 블로그".
  글 화면은 `글 제목 · 개발자 찬빈` 이면 충분하다. 그 자리에서는 이미 글이라는 것이 분명하고,
  제목마다 "블로그"를 붙이면 검색 결과에서 잘려 나가는 쪽이 제목이 된다.
*/
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  icons: { icon: "/favicon.svg" },
  /*
    검색엔진에 소유를 확인시키는 토큰 (ADR-0060).

    파일을 올리는 방법도 있지만 메타 태그로 둔다. 파일 방식은 루트에 정체를 알 수 없는
    파일 하나가 남고, 이 값이 메타데이터라는 사실이 어디에도 적히지 않는다.
    여기 두면 사이트가 스스로를 설명하는 것들과 한자리에 모인다.

    비밀이 아니다. 어느 방식이든 공개된 자리에서 읽히도록 설계된 값이라
    공개 저장소에 그대로 둔다 — 숨기는 시늉을 하면 다음 사람이 비밀인 줄 안다.
  */
  verification: {
    other: { "naver-site-verification": "8b9c53bf417d46a359cd857d0b5dcf062dedc984" },
  },
  // 쿼리스트링이 붙은 주소가 중복 페이지로 잡히지 않게 정본을 밝힌다 (ADR-0044)
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": [{ url: "/rss.xml", title: `${SITE.name} 피드` }] },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
};

// 하이드레이션 전 동기 실행: 저장된 테마(없으면 OS 설정)를 적용해 새로고침 깜빡임(FOUC)을 막는다.
const themeInitScript = `(function(){try{var m=matchMedia('(prefers-color-scheme:dark)');var a=function(d){document.documentElement.classList.toggle('dark',d);};var ls=localStorage.getItem('theme');a(ls?ls==='dark':m.matches);var on=function(e){if(!localStorage.getItem('theme'))a(e.matches);};m.addEventListener?m.addEventListener('change',on):m.addListener(on);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
