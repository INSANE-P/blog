/**
 * 노션 API 클라이언트 (ADR-0022).
 *
 * 버전을 둘로 나눠 쓴다 — 마크다운 엔드포인트는 최신 버전에만 있고,
 * DB 쿼리는 안정된 구버전으로 충분하다. 하나로 통일하려다 한쪽이 깨지는 것보다
 * 용도별로 고정하는 편이 안전하다.
 */

const API = "https://api.notion.com/v1";

/** DB 쿼리·페이지 조회용 (안정 버전) */
const V_DATA = "2022-06-28";
/** 페이지를 마크다운으로 받는 엔드포인트용 (이 버전부터 존재) */
const V_MARKDOWN = "2025-09-03";

/** 노션에서 읽어온 글 하나. DB로 넘어가기 전의 모양. */
export type NotionPost = {
  pageId: string;
  slug: string;
  title: string;
  summary: string;
  /** "YYYY-MM-DD" */
  date: string;
  tags: string[];
  published: boolean;
  /** 페이지 커버 URL(서명·만료됨). 없으면 undefined */
  coverUrl?: string;
  /** 본문 마크다운 */
  body: string;
};

function token(): string {
  const t = process.env.NOTION_TOKEN;
  if (!t) throw new Error("NOTION_TOKEN이 설정되지 않았습니다");
  return t;
}

async function call<T>(path: string, version: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Notion-Version": version,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`노션 ${path} 실패 (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

/* ── 속성 읽기 헬퍼 ─────────────────────────────
   속성 이름은 노션 UI의 한글 이름과 1:1로 묶여 있다.
   이름을 바꾸면 동기화가 조용히 깨지므로 여기 한 곳에만 둔다. */

const PROP = {
  title: "제목",
  slug: "슬러그",
  published: "발행",
  date: "날짜",
  tags: "태그",
  summary: "요약",
} as const;

type NotionProp = {
  type: string;
  title?: { plain_text: string }[];
  rich_text?: { plain_text: string }[];
  checkbox?: boolean;
  date?: { start: string } | null;
  multi_select?: { name: string }[];
};

type NotionPage = {
  id: string;
  properties: Record<string, NotionProp>;
  cover?:
    | { type: "external"; external: { url: string } }
    | { type: "file"; file: { url: string } }
    | null;
};

const text = (p?: NotionProp): string =>
  (p?.title ?? p?.rich_text ?? []).map((t) => t.plain_text).join("").trim();

function coverUrlOf(page: NotionPage): string | undefined {
  if (!page.cover) return undefined;
  return page.cover.type === "external" ? page.cover.external.url : page.cover.file.url;
}

/** 노션 DB의 모든 글을 읽는다(본문 제외). 페이지네이션을 끝까지 따라간다. */
export async function listPages(): Promise<NotionPage[]> {
  const dbId = process.env.NOTION_DATABASE_ID;
  if (!dbId) throw new Error("NOTION_DATABASE_ID가 설정되지 않았습니다");

  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const res = await call<{
      results: NotionPage[];
      has_more: boolean;
      next_cursor: string | null;
    }>(`/databases/${dbId}/query`, V_DATA, {
      method: "POST",
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
    });
    pages.push(...res.results);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

/** 페이지 본문을 마크다운으로 받는다. 변환기를 직접 만들지 않는 이유는 ADR-0022 참고. */
export async function fetchMarkdown(pageId: string): Promise<string> {
  const res = await call<{ markdown?: string; content?: string }>(
    `/pages/${pageId}/markdown`,
    V_MARKDOWN,
  );
  return res.markdown ?? res.content ?? "";
}

/** 페이지 속성을 우리 모양으로 옮긴다. 본문은 별도로 채운다. */
export function toPost(page: NotionPage, body: string): NotionPost {
  const props = page.properties;
  return {
    pageId: page.id,
    slug: text(props[PROP.slug]),
    title: text(props[PROP.title]),
    summary: text(props[PROP.summary]),
    date: props[PROP.date]?.date?.start?.slice(0, 10) ?? "",
    tags: props[PROP.tags]?.multi_select?.map((t) => t.name) ?? [],
    published: props[PROP.published]?.checkbox ?? false,
    coverUrl: coverUrlOf(page),
    body,
  };
}
