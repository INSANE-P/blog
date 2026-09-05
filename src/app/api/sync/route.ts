import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { syncFromNotion } from "@/lib/notion/sync";
import { SITE, absolute } from "@/lib/site";

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

/**
 * 버린 캐시를 미리 데운다 (ADR-0048).
 *
 * `revalidatePath` 는 캐시를 **"낡음"으로 표시만** 한다. 다시 만드는 일은 다음 요청이 한다.
 * 그래서 동기화 직후 처음 들어온 사람은 **옛 화면을 받고**, 그 사람의 요청이
 * 뒤에서 재생성을 시작한다. 두 번째 사람부터 새 화면이다.
 *
 * 글을 쓰고 동기화한 뒤 바로 확인하는 사람이 늘 그 "첫 사람"이라,
 * "발행했는데 안 보인다"로 느껴진다. 실제로 그렇게 겪었다.
 *
 * 그래서 여기서 한 번씩 불러 둔다. 재생성이 방문자의 요청이 아니라 이 요청 안에서 끝난다.
 *
 * 실패해도 그냥 둔다 — 데우지 못하면 예전처럼 첫 방문자가 재생성을 시작할 뿐,
 * 잘못된 화면이 나가지는 않는다. 동기화 자체를 실패로 만들 일이 아니다.
 */
async function warm(paths: string[]): Promise<void> {
  await Promise.allSettled(
    paths.map((path) =>
      fetch(absolute(path), {
        // 캐시를 데우는 것이 목적이므로 응답 내용은 쓰지 않는다
        headers: { "user-agent": `${SITE.name} sync warmer` },
        cache: "no-store",
      }),
    ),
  );
}

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

    /*
      캐시를 버린다 (ADR-0045).

      공개 화면은 캐시되므로 여기서 버려 주지 않으면 글을 고쳐도 안전망 주기(1시간)가
      지날 때까지 옛것이 나간다. 캐시를 켜는 것과 이 호출은 한 몸이다.

      **지워진 글도 버린다.** 안 그러면 노션에서 지운 글이 캐시에 남아 계속 열린다.
      바뀐 것이 없어 건너뛴 글은 버리지 않는다 — 버릴 이유가 없다.

      사이트맵과 피드도 목록이 바뀌면 같이 바뀐다.
    */
    const paths = [
      "/",
      "/posts",
      "/sitemap.xml",
      "/rss.xml",
      ...result.synced.map((slug) => `/posts/${slug}`),
      ...result.removed.map((slug) => `/posts/${slug}`),
    ];
    for (const path of paths) revalidatePath(path);

    // 버리기만 하면 첫 방문자가 옛것을 받는다. 여기서 미리 데운다(ADR-0048).
    await warm(paths);

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
