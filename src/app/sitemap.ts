import type { MetadataRoute } from "next";
import { getList } from "@/features/posts/queries";
import { lastModifiedOf } from "@/lib/seo/feed";
import { absolute } from "@/lib/site";
import { entryHref } from "@/features/posts/types";

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

  return [
    { url: absolute("/"), lastModified: newest },
    { url: absolute("/posts"), lastModified: newest },
    { url: absolute("/about"), lastModified: newest },
    ...entries.map((e) => ({
      url: absolute(entryHref(e)),
      lastModified: lastModifiedOf(e),
    })),
  ];
}
