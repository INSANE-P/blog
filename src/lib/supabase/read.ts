import { createClient } from "@supabase/supabase-js";

/**
 * 공개 글을 읽는 Supabase 클라이언트 (ADR-0045).
 *
 * **쿠키를 쓰지 않는다.** 이게 이 파일의 존재 이유다.
 *
 * 전에는 `@supabase/ssr` 의 쿠키 기반 클라이언트를 썼다. 로그인 세션을 읽어야 했기 때문인데,
 * 인증은 노션 전환 때 없어졌다(ADR-0022). 그런데 클라이언트는 그대로 남아 있었고,
 * Next 에서 `cookies()` 를 건드리면 그 화면은 **무조건 동적**이 된다 —
 * 아무도 쓰지 않는 세션 때문에 모든 화면의 캐시를 포기하고 있었다.
 *
 * 익명 키로 읽는다. 초안이 새지 않는 것은 RLS 가 지킨다.
 *
 *   create policy "published posts are readable by anyone"
 *     using (status = 'published');
 *
 * 코드의 `.eq("status", "published")` 는 그 위에 한 겹 더 두른 것이다.
 * 정책과 질의 둘 다 걸러야 한 쪽이 잘못돼도 초안이 나가지 않는다.
 *
 * 요청마다 만들지 않고 모듈에 하나 둔다. 익명 읽기 전용이라 요청 사이에 남는 상태가 없다.
 */
export const readDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
