import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 홈 디렉터리의 다른 lockfile 때문에 워크스페이스 루트가 잘못 추론되는 것 방지
  outputFileTracingRoot: __dirname,
  images: {
    // Supabase Storage 등 외부 이미지 호스트는 여기에 추가
    remotePatterns: [],
  },
  /*
    미리보기는 검색엔진에 나오면 안 된다 (ADR-0061).
    HTML 의 robots 메타는 404 응답이나 리다이렉트에는 붙지 않으므로, 응답 헤더로도 막는다.
    들어가는 주소는 비밀값을 쿼리에 담으므로 다른 사이트로 넘어갈 때 Referer 에 실리지 않게 한다.
  */
  async headers() {
    const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" };
    const noStore = { key: "Cache-Control", value: "private, no-store" };
    const noReferrer = { key: "Referrer-Policy", value: "no-referrer" };
    return [
      { source: "/preview", headers: [noindex, noStore, noReferrer] },
      { source: "/preview/:path*", headers: [noindex, noStore, noReferrer] },
      { source: "/api/preview/:path*", headers: [noindex, noStore, noReferrer] },
      { source: "/api/preview", headers: [noindex, noStore, noReferrer] },
    ];
  },
};

export default nextConfig;
