import { cache } from "react";
import { firstImageOf } from "@/lib/content/first-image";
import { youTubeId } from "@/lib/content/youtube-id";
import {
  belongsToBlog,
  fetchMarkdown,
  fetchPage,
  listPages,
  toPost,
} from "@/lib/notion/client";
import { htmlToMarkdown } from "@/lib/notion/html-to-markdown";
import { resolveYouTubeTitles } from "@/lib/notion/youtube-titles";
import type { Entry } from "@/features/posts/types";

/**
 * 미리보기 읽기 경계 (ADR-0061).
 *
 * 공개 화면과 달리 **노션을 그 자리에서 읽는다.** 공개 화면이 노션을 직접 읽지 않는 이유는
 * 노션 장애가 사이트 장애가 되기 때문인데(ADR-0022), 미리보기는 나 혼자 보는 화면이라
 * 그 걱정이 없고, 대신 노션에서 고친 것이 동기화 없이 바로 보인다는 이득이 크다.
 *
 * 본문은 동기화와 **같은 변환**을 거친다. 미리보기가 다르게 그리면 미리 볼 이유가 없다.
 * 그림을 R2 로 옮기는 일만 하지 않는다. 노션 그림 주소는 한 시간 뒤 만료되지만
 * 미리보기는 그 안에 다시 읽으므로 상관없다.
 */

export type PreviewItem = {
  pageId: string;
  title: string;
  slug: string;
  date: string;
  published: boolean;
  editedAt?: string;
};

export type Preview = {
  entry: Entry;
  published: boolean;
  /** 발행하면 걸릴 것들. 화면 아래 띠에 보여 준다 */
  warnings: string[];
};

// 하이픈 없는 32자. 진입 주소에서 하이픈을 빼서 넘긴다
const PAGE_ID = /^[0-9a-f]{32}$/i;

/** 블로그 데이터베이스의 모든 글. 최근에 고친 것이 위로 온다 */
export async function listForPreview(): Promise<PreviewItem[]> {
  const pages = await listPages();
  return pages
    .map((page) => {
      const post = toPost(page, "");
      return {
        pageId: page.id.replace(/-/g, ""),
        title: post.title,
        slug: post.slug,
        date: post.date,
        published: post.published,
        editedAt: page.last_edited_time,
      };
    })
    .sort((a, b) => (b.editedAt ?? "").localeCompare(a.editedAt ?? ""));
}

/**
 * 글 하나를 발행했을 때의 모양으로. 블로그 글이 아니거나 없으면 null.
 *
 * 제목(메타데이터)과 화면이 같은 요청에서 둘 다 부르므로 `cache` 로 묶어 노션을 한 번만 읽는다.
 */
export const getPreview = cache(async (pageId: string): Promise<Preview | null> => {
  if (!PAGE_ID.test(pageId)) return null;

  let page;
  try {
    page = await fetchPage(pageId);
  } catch {
    // 없는 페이지, 연동이 못 읽는 페이지 모두 같은 404 로 돌린다
    return null;
  }
  if (!belongsToBlog(page)) return null;

  const converted = htmlToMarkdown(await fetchMarkdown(page.id));
  const post = toPost(page, converted.markdown);
  post.body = await resolveYouTubeTitles(post.body, youTubeId);

  const warnings: string[] = [];
  if (!post.slug) warnings.push("슬러그가 비어 있어요. 이대로 발행하면 동기화가 이 글을 건너뛰어요.");
  if (!post.date) warnings.push("날짜가 비어 있어요.");
  if (converted.unknownTags.length > 0) {
    warnings.push(
      `블로그가 모르는 노션 서식이 있어요(${converted.unknownTags.join(", ")}). 글자만 남고 모양은 빠져요.`,
    );
  }

  return {
    entry: {
      slug: post.slug,
      title: post.title || "(제목 없음)",
      excerpt: post.summary,
      date: post.date,
      tags: post.tags.length ? post.tags : undefined,
      // 발행할 때와 같은 규칙: 커버가 없으면 본문 첫 그림이 대표 이미지가 된다
      coverImage: post.coverUrl ?? firstImageOf(post.body),
      body: post.body,
    },
    published: post.published,
    warnings,
  };
});
