import localFont from "next/font/local";

/*
  본문 — 가변 폰트 한 파일로 전 굵기를 덮는다. 본문은 첫 화면에 반드시 필요하므로 preload 유지.

  제목용 Gmarket Sans 는 지웠다(ADR-0024·0028). 시각 정체성을 포트폴리오와 맞추면서
  제목을 Montserrat + Pretendard 로 옮겼는데, 폰트 로더만 남아 있어 쓰지도 않는 웹폰트
  세 벌을 계속 내려받고 있었다. 화면에서 걷어낸 것은 코드에서도 걷어내야 한다.
*/
export const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-pretendard",
});
