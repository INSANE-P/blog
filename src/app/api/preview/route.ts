import { createHash, timingSafeEqual } from "node:crypto";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/**
 * 미리보기 들어가기 (ADR-0061).
 *
 * 비밀값이 맞으면 Next 의 Draft Mode 쿠키를 켜고 미리보기 목록으로 보낸다.
 * 쿠키는 배포마다 바뀌는 서명값이라 흉내 낼 수 없고, httpOnly 라 페이지 스크립트도 못 읽는다.
 * 노션 데이터베이스 맨 위에 이 주소를 북마크로 두고 쓴다.
 *
 * 틀리면 401 이 아니라 404 를 준다. "여기 잠긴 문이 있다"는 사실부터 알릴 필요가 없다.
 *
 * 비밀값은 동기화 토큰과 나눈다(PREVIEW_SECRET). 미리보기 주소는 브라우저 기록에 남는데,
 * 같은 값을 쓰면 그 기록 하나로 동기화까지 부를 수 있게 된다.
 */

// 32자보다 짧은 값은 없는 것으로 친다. 비밀값을 깜빡 짧게 넣은 채로 열리는 것보다 닫혀 있는 편이 낫다
const MIN_SECRET = 32;

// 노션 페이지 id: 하이픈 없는 32자 또는 하이픈 있는 uuid
const PAGE_ID = /^[0-9a-f]{32}$|^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

/** 길이가 달라도 시간이 새지 않게 해시를 먼저 맞춘 뒤 견준다 */
function same(given: string, secret: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const secret = process.env.PREVIEW_SECRET;
  const url = new URL(req.url);
  const given = url.searchParams.get("secret") ?? "";

  if (!secret || secret.length < MIN_SECRET || !same(given, secret)) {
    return new Response("Not Found", { status: 404 });
  }

  (await draftMode()).enable();

  // 글 하나로 바로 가고 싶으면 `&page=<노션 페이지 id>` 를 붙인다
  const page = url.searchParams.get("page");
  redirect(page && PAGE_ID.test(page) ? `/preview/${page.replace(/-/g, "")}` : "/preview");
}
