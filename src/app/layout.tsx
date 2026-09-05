import type { Metadata } from "next";
import { pretendard } from "./fonts";
import "./globals.css";

/*
  사이트 이름은 "설화"에서 사람 이름으로 바꿨다(ADR-0024).
  불꽃·서리 정체성을 걷어내면서 그 이름이 가리키던 것이 화면에 하나도 남지 않았고,
  포트폴리오와 같은 사람이라는 사실이 이름에서 바로 읽히는 편이 낫다.
*/
const description = "도전하고, 그 과정을 기록합니다. 박찬빈의 개인 블로그.";
// 커스텀 도메인이 생기면 Vercel env NEXT_PUBLIC_SITE_URL만 바꾸면 된다.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://frost-log.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "박찬빈",
    template: "%s · 박찬빈",
  },
  description,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: "박찬빈",
    locale: "ko_KR",
    url: siteUrl,
    title: "박찬빈",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "박찬빈",
    description,
  },
};

// 하이드레이션 전 동기 실행: 저장된 테마(없으면 OS 설정)를 적용해 새로고침 깜빡임(FOUC)을 막는다.
const themeInitScript = `(function(){try{var m=matchMedia('(prefers-color-scheme:dark)');var a=function(d){document.documentElement.classList.toggle('dark',d);};var ls=localStorage.getItem('theme');a(ls?ls==='dark':m.matches);var on=function(e){if(!localStorage.getItem('theme'))a(e.matches);};m.addEventListener?m.addEventListener('change',on):m.addListener(on);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={pretendard.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
