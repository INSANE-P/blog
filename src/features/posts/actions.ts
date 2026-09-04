"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * "불 지피기" — 로그인 없이 누르는 익명 반응(ADR-0016).
 *
 * 글을 쓰고 고치는 액션은 여기 없다. 노션이 정본이 되면서 작성 경로가
 * 동기화로 옮겨갔기 때문이다(ADR-0022). 이 파일에는 방문자가 남기는 것만 둔다.
 */
export async function stokePost(slug: string): Promise<number | null> {
  if (!slug) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("increment_stokes", { p_slug: slug });
  if (error) return null;
  return typeof data === "number" ? data : null;
}
