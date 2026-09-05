import type { MetadataRoute } from "next";
import { absolute } from "@/lib/site";

/**
 * robots.txt (ADR-0044).
 *
 * 막을 것이 없다. 관리자 화면은 노션 전환 때 없앴고, API 는 동기화 하나뿐인데
 * 토큰이 없으면 아무것도 하지 않는다. 그래도 `/api` 는 빼 둔다 —
 * 크롤러가 읽어 봐야 얻을 것이 없는 주소이고, 색인에 나오면 이상하다.
 *
 * 이 파일의 진짜 일은 사이트맵 위치를 알리는 것이다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: absolute("/sitemap.xml"),
    host: absolute("/"),
  };
}
