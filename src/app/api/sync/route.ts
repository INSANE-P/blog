import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { syncFromNotion } from "@/lib/notion/sync";

/**
 * 노션 → DB 동기화 트리거 (ADR-0022).
 *
 * 공개된 주소라 토큰으로 막는다. 노션 페이지에 이 주소를 북마크로 두면
 * 글을 쓰고 한 번 눌러 발행할 수 있다.
 *
 * 응답은 무엇이 되었고 무엇이 안 되었는지를 그대로 담는다. 부분 성공을 200으로 돌리면
 * 아무도 알아채지 못한 채 사이트가 어긋난다.
 */

// 이미지까지 붙으면 시간이 늘어난다. Hobby 플랜 상한이 300초다.
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return false;

  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("token");
  const fromHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return fromQuery === secret || fromHeader === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncFromNotion();

    // 바뀐 글의 경로와 목록을 다시 만든다
    revalidatePath("/");
    revalidatePath("/posts");
    for (const slug of result.synced) revalidatePath(`/posts/${slug}`);

    /*
      한 글이라도 실패했으면 실패로 응답한다.
      이미지 이관 실패도 같이 본다 — 남은 노션 URL은 곧 만료돼 그림이 깨진다.

      모르는 태그는 실패로 보지 않는다. 글자는 살아 있어 읽는 데 지장이 없고,
      노션이 블록을 새로 내면 언제든 나올 수 있는 일이라 이것까지 500으로 막으면
      발행이 통째로 서 버린다. 대신 응답에 담아 눈에 띄게 한다.
    */
    const ok = result.failed.length === 0 && result.imageFailures.length === 0;
    return NextResponse.json(result, { status: ok ? 200 : 500 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

/** 브라우저에서 눌러 확인할 수 있게 GET도 같은 동작을 허용한다. */
export const GET = POST;
