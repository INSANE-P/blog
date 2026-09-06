import { renderOg } from "@/features/posts/og";
import { SITE } from "@/lib/site";

// 사이트 기본 소셜 공유 이미지(글별 OG가 없는 페이지에 적용).
export const alt = `${SITE.title} — 도전하고, 그 과정을 기록합니다`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOg({
    title: "도전하고,\n그 과정을 기록합니다",
    footnote: SITE.title,
    titleSize: 88,
  });
}
