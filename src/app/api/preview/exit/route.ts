import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/**
 * 미리보기 나가기 (ADR-0061).
 *
 * 쿠키를 끄고 홈으로 보낸다. 켜 둔 채로 두면 이 브라우저에서는 공개 화면도
 * 캐시 없이 매번 새로 그려진다. 보이는 것은 같지만 굳이 그럴 이유가 없다.
 */
export async function GET() {
  (await draftMode()).disable();
  redirect("/");
}
