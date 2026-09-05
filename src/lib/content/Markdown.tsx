import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkHighlight } from "./remark-highlight";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { CodeBlock } from "./CodeBlock";
import { plainText, slugify } from "./headings";

/** hast 노드에서 사람이 읽는 글자만 모은다 — 복사 버튼에 넘길 원문 코드 */
type HastNode = { type?: string; value?: string; children?: HastNode[] };
function textOf(node?: HastNode): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textOf).join("");
}

/**
 * 마크다운 본문 렌더 (ADR-0027).
 *
 * GFM(표·체크박스·자동링크) + 코드 하이라이트 + 수식(KaTeX).
 * react-markdown 은 기본적으로 원시 HTML 을 렌더하지 않아 XSS 에 안전하다(rehype-raw 미사용).
 * 출력 요소는 대부분 .prose 가 스타일링하고, 여기서는 구조가 달라져야 하는 셋만 바꾼다.
 *
 *   - 이미지 → figure + figcaption. 노션 캡션이 마크다운 alt 로 넘어오므로 화면에 보여 준다
 *   - 코드 블록 → 언어 표시와 복사 버튼이 달린 상자
 *   - h2 → 앵커 id(눈에 보이는 # 는 두지 않는다). 목차가 여기로 내려간다
 *   - 표 → 가로로 넘길 수 있는 상자로 감싼다. 칸이 많아도 본문이 밀리지 않는다
 */
export function Markdown({ children }: { children: string }) {
  // 노션은 하드 줄바꿈을 <br> 로 낸다. 원시 HTML 은 렌더하지 않으므로(XSS 안전),
  // <br> 만 마크다운 하드 브레이크(공백 2 + 줄바꿈)로 바꿔 줄바꿈만 안전하게 살린다.
  const normalized = children.replace(/<br\s*\/?>\n?/gi, "  \n");

  // 같은 제목이 두 번 나와도 id 가 겹치지 않게 이 렌더 안에서만 세어 둔다
  const seen = new Map<string, number>();

  const components: Components = {
    /*
      제목의 앵커 id 는 렌더된 글자에서 만든다.
      React children 을 String() 으로 바꾸면, 굵게·인라인 코드·링크가 든 제목에서
      배열 안의 React 요소가 "[object Object]" 가 되어 목차가 가리키는 id 와 어긋난다
      (눌러도 아무 데도 가지 않는다).
    */
    h2({ children, node }) {
      const id = slugify(plainText(textOf(node as HastNode)), seen);
      /*
        id 만 달고 눈에 보이는 앵커(#)는 두지 않는다.
        절 하나를 따로 공유하는 일은 거의 없는데, 그 대가로 제목마다 호버할 때
        기호가 튀어나와 읽는 흐름을 끊었다. 링크가 필요하면 목차에서 눌러
        주소창에 남은 것을 복사하면 된다 — 같은 id 라 결과가 같다.
      */
      return <h2 id={id}>{children}</h2>;
    },

    /*
      이미지 한 장만 든 문단은 <p> 를 걷어내고 <figure> 로 바꾼다.
      <p> 안에 <figure> 를 넣으면 브라우저가 문단을 강제로 닫아 DOM 이 어긋난다.
    */
    p({ children, node }) {
      const kids = node?.children ?? [];
      const only = kids.length === 1 ? kids[0] : undefined;
      if (only && only.type === "element" && only.tagName === "img") {
        const props = only.properties as { src?: string; alt?: string };
        return <Figure src={String(props.src ?? "")} caption={props.alt ?? ""} />;
      }
      return <p>{children}</p>;
    },

    /*
      문단 안에 글과 섞여 들어온 이미지. 이때는 figure 로 감싸지 않는다 —
      <p> 안에 <figure> 를 넣으면 브라우저가 문단을 강제로 닫아 DOM 이 어긋난다.
    */
    img({ src, alt }) {
      const size = sizeOf(String(src ?? ""));
      return (
        // 그림은 R2 에서 오고 치수를 이미 안다. next/image 의 최적화가 할 일이 없다
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={String(src ?? "")}
          alt={alt ?? ""}
          width={size?.w}
          height={size?.h}
          loading="lazy"
        />
      );
    },

    table({ children }) {
      return (
        <div className="table-scroll">
          <table>{children}</table>
        </div>
      );
    },

    pre({ children, node }) {
      const codeNode = (node?.children ?? []).find(
        (c) => (c as { tagName?: string }).tagName === "code",
      ) as { properties?: { className?: string[] } } | undefined;
      const cls = codeNode?.properties?.className ?? [];
      const lang = cls
        .find((c) => typeof c === "string" && c.startsWith("language-"))
        ?.replace("language-", "");
      return (
        <CodeBlock lang={lang} code={textOf(node as HastNode)}>
          <pre>{children}</pre>
        </CodeBlock>
      );
    },
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkHighlight]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      /*
        각주 안내 문구를 우리말로. 기본값은 "Footnotes"·"Back to content" 라
        한글 글 끝에 영문 제목이 혼자 서 있게 된다.
      */
      remarkRehypeOptions={{
        footnoteLabel: "각주",
        footnoteBackLabel: "본문으로 돌아가기",
      }}
      components={components}
    >
      {normalized}
    </ReactMarkdown>
  );
}

/**
 * 본문 그림.
 *
 * 폭은 언제나 본문에 맞춘다 — 원본 크기대로 두면 그림마다 왼쪽 끝이 달라져
 * 글이 정돈돼 보이지 않는다. 세로가 긴 그림(휴대폰 화면 캡처)만 좁힌다.
 *
 * 치수는 동기화가 파일 이름에 넣어 둔다(`<해시>-1600x900.webp`). width/height 를 심어 두면
 * 그림이 늦게 와도 글이 밀리지 않는다. 치수를 모르는 그림(노션 밖에서 링크로 넣은 것)은
 * 자리를 잡을 수 없으므로 폭을 채우는 대신 원래 크기를 지키게 둔다.
 */
/**
 * 그림의 크기 갈래 (ADR-0046).
 *
 * 처음에는 "세로가 더 길면 세로형, 아니면 넓게" 둘로만 나눴다.
 * 그러면 943×754(5:4) 처럼 **거의 정사각형인 그림도 본문 밖으로 나간다.**
 * 실제로 그렇게 나갔고, 글을 읽다 말고 큰 덩어리를 만나는 꼴이 됐다.
 *
 * 넓게 낼 만한 그림은 **가로로 긴 것**뿐이다. 16:9(1.78) 짜리 화면 캡처나 파노라마는
 * 좁히면 안이 안 보이지만, 4:3 이나 5:4 는 넓혀도 얻는 것이 없고 자리만 크게 먹는다.
 * 그래서 1.7 을 경계로 둔다 — 16:9 는 넘고 3:2(1.5) 는 못 넘는 자리다.
 */
function fitOf(size: { w: number; h: number } | undefined) {
  if (!size) return "unknown";
  if (size.h > size.w * 1.15) return "tall";
  if (size.w >= size.h * 1.7) return "wide";
  return "normal";
}

function Figure({ src, caption }: { src: string; caption: string }) {
  const size = sizeOf(src);
  return (
    <figure
      data-fit={fitOf(size)}
      /*
        그림의 원래 폭을 CSS 에 넘긴다. 이것이 없으면 작은 그림이 본문 폭까지 늘어나
        흐려진다 — 없는 화소를 만들어 낼 수는 없다.
      */
      style={size ? ({ "--nat": `${size.w}px` } as React.CSSProperties) : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={caption} width={size?.w} height={size?.h} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** `images/<해시>-1600x900.webp` 에서 치수를 읽는다 */
function sizeOf(src: string): { w: number; h: number } | undefined {
  const m = src.match(/-(\d+)x(\d+)\.[a-z0-9]+$/i);
  return m ? { w: Number(m[1]), h: Number(m[2]) } : undefined;
}
