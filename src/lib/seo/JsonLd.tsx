import { SITE, absolute } from "@/lib/site";
import { coverOf, entryHref, type Entry } from "@/features/posts/types";
import { lastModifiedOf } from "./feed";

/**
 * 구조화 데이터 (ADR-0044).
 *
 * 검색엔진에게 "이건 글이다"를 기계가 읽는 모양으로 말한다. 화면의 HTML 만으로는
 * 제목이 제목인 줄은 알아도 그것이 언제 쓴 누구의 글인지는 추측에 맡기게 된다.
 *
 * `<script type="application/ld+json">` 은 브라우저가 실행하지 않는 데이터 블록이다.
 * `dangerouslySetInnerHTML` 을 쓰는 유일한 자리라 값은 우리가 만든 객체만 넣는다 —
 * 사용자 입력이 아니라 DB 의 글 메타이고, `JSON.stringify` 를 거친다.
 * 그래도 `<` 는 한 번 더 막는다. 제목에 `</script>` 가 들어오면 블록이 거기서 끊긴다.
 */
function Block({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

/** 글 하나 — 상세 화면에 넣는다 */
export function ArticleJsonLd({ entry }: { entry: Entry }) {
  const url = absolute(entryHref(entry));
  const cover = coverOf(entry);
  return (
    <Block
      data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: entry.title,
        description: entry.excerpt || SITE.description,
        url,
        mainEntityOfPage: url,
        datePublished: entry.publishedAt ?? `${entry.date}T00:00:00Z`,
        dateModified: lastModifiedOf(entry).toISOString(),
        inLanguage: SITE.lang,
        author: { "@type": "Person", name: SITE.author.name, url: SITE.author.url },
        publisher: { "@type": "Person", name: SITE.author.name, url: SITE.url },
        ...(cover ? { image: [absolute(cover)] } : {}),
        ...(entry.tags?.length ? { keywords: entry.tags.join(", ") } : {}),
      }}
    />
  );
}

/**
 * 사이트 자체 — 홈에 하나만 넣는다.
 *
 * `Blog` 와 `Person` 을 따로 두지 않고 `Blog` 의 author 로 사람을 묶는다.
 * 블록을 둘로 나누면 검색엔진이 둘의 관계를 다시 추측해야 한다.
 */
export function SiteJsonLd() {
  return (
    <Block
      data={{
        "@context": "https://schema.org",
        "@type": "Blog",
        name: SITE.name,
        description: SITE.description,
        url: SITE.url,
        inLanguage: SITE.lang,
        author: { "@type": "Person", name: SITE.author.name, url: SITE.author.url },
      }}
    />
  );
}
