import type { MetadataRoute } from "next";
import { getList } from "@/features/posts/queries";
import { lastModifiedOf } from "@/lib/seo/feed";
import { absolute } from "@/lib/site";
import { entryHref } from "@/features/posts/types";

/** 안전망 주기의 근거는 홈 화면에 적어 두었다 (ADR-0045) */
export const revalidate = 3600;

/**
 * 사이트맵 (ADR-0044).
 *
 * 고정 화면 셋과 발행된 글 전부를 싣는다. 초안은 목록 조회가 이미 걸러낸다 —
 * 사이트맵에만 따로 조건을 쓰면 두 곳이 언젠가 어긋난다.
 *
 * `priority` 는 쓰지 않는다. 검색엔진이 오래전부터 무시하는 값이라,
 * 적어 두면 "무언가 조정하고 있다"는 착각만 남는다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getList();
  const newest = entries.length > 0 ? lastModifiedOf(entries[0]) : new Date();

  /*
    홈과 목록은 글이 바뀌면 실제로 바뀌므로 가장 최근 글의 시각을 쓴다.
    소개는 아니다 — 글을 하나 올렸다고 소개가 바뀌지 않는데 그렇게 적으면 거짓말이 된다.
    틀린 `lastmod` 는 없는 것보다 나쁘다. 검색엔진이 이 값을 믿지 않게 되기 때문이다.
  */
  return [
    { url: absolute("/"), lastModified: newest },
    { url: absolute("/posts"), lastModified: newest },
    { url: absolute("/about") },
    ...entries.map((e) => ({
      url: absolute(entryHref(e)),
      lastModified: lastModifiedOf(e),
    })),
  ];
}
