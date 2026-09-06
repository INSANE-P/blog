import { NextResponse } from "next/server";
import { readDb } from "@/lib/supabase/read";

/**
 * DB 를 깨워 두는 자리 (ADR-0059).
 *
 * Supabase 무료 요금제는 **1주일 활동이 없으면 프로젝트를 멈춘다.**
 * 우리 공개 화면은 전부 캐시라 캐시가 맞으면 DB 를 아예 건드리지 않는다(ADR-0045).
 * 방문이 뜸한 주가 있으면 일주일 내내 질의가 한 번도 안 갈 수 있다 —
 * **캐시를 잘 만든 대가로 생긴 문제다.**
 *
 * 그래서 하루 한 번 여기를 두드린다(`vercel.json`).
 *
 * 깨우는 일이 요금제를 갉아먹으면 앞뒤가 안 맞으므로, 값은 두 가지로 눌러 두었다.
 *
 * - **행을 읽지 않는다.** `head: true` 는 개수만 묻고 본문 없는 응답을 받는다.
 *   한 번에 수백 바이트다. 월 30회면 전송량은 반올림하면 0 이다
 * - **화면을 재생성시키지 않는다.** 캐시된 페이지를 두드리면 ISR 이 돌아
 *   오히려 전송량을 쓴다. 그래서 아무것도 그리지 않는 전용 경로를 둔다
 *
 * 읽기 전용 익명 클라이언트를 쓴다. 이 경로가 열려 있어도 나가는 것은 글의 개수뿐이고,
 * 그 값은 목록 화면이 이미 보여 준다.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  /*
    `CRON_SECRET` 을 넣어 두면 Vercel 이 크론 요청에 그 값을 실어 보낸다.
    안 넣어도 동작한다 — 이 경로가 하는 일이 개수를 세는 것뿐이라 막을 것이 크지 않고,
    처음부터 환경변수를 요구하면 배포가 한 단계 더 필요해진다.
  */
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { count, error } = await readDb
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if (error) {
    // 조용히 200 을 돌리면 멈춘 것을 아무도 모른다
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, posts: count ?? 0, at: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
