import type { Metadata } from "next";
import { pretendard } from "./fonts";
import { SITE } from "@/lib/site";
import "./globals.css";

/*
  사이트 이름은 "설화"에서 사람 이름으로 바꿨다(ADR-0024).
  불꽃·서리 정체성을 걷어내면서 그 이름이 가리키던 것이 화면에 하나도 남지 않았고,
  포트폴리오와 같은 사람이라는 사실이 이름에서 바로 읽히는 편이 낫다.
*/
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  icons: { icon: "/favicon.svg" },
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
    title: SITE.name,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
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
