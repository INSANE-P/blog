import { ImageResponse } from "next/og";

/*
  소셜 공유 이미지 (ADR-0028).

  마스코트를 걷어내고 활자만 남겼다. 공유 카드는 타임라인에서 손톱만 하게 줄어드는데,
  그림과 글자가 자리를 나눠 가지면 둘 다 안 읽힌다. 제목 하나가 화면을 다 쓰게 두었다.

  배경은 검정이다. 타임라인은 흰 카드가 줄지어 있는 곳이라, 검은 카드 하나가 그 사이에서
  눈에 걸린다(폰 레스토프 효과). 사이트의 다크 모드와도 같은 화면이 된다.

  폰트는 절대 CDN URL 이라 서버에서 fetch 할 수 있다. 상대 경로는 배포 환경에서 실패한다.
*/
const FONT_700 =
  "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-700-normal.woff";
const FONT_400 =
  "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-400-normal.woff";

export const OG_SIZE = { width: 1200, height: 630 };

async function loadFonts() {
  const [bold, reg] = await Promise.all([
    fetch(FONT_700).then((r) => r.arrayBuffer()),
    fetch(FONT_400).then((r) => r.arrayBuffer()),
  ]);
  return [
    { name: "Noto", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Noto", data: reg, weight: 400 as const, style: "normal" as const },
  ];
}

/** 제목이 길수록 작게 — 넘쳐서 잘리는 것보다 작아지는 편이 낫다 */
function titleSizeFor(title: string) {
  if (title.length <= 8) return 108;
  if (title.length <= 16) return 86;
  if (title.length <= 26) return 68;
  return 56;
}

export async function renderOg({
  eyebrow,
  title,
  footnote,
  meta,
  titleSize,
}: {
  eyebrow?: string;
  title: string;
  footnote?: string;
  /** 아래 줄 오른쪽 — 글이면 날짜가 온다 */
  meta?: string;
  titleSize?: number;
}) {
  const fonts = await loadFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px 84px",
          backgroundColor: "#000000",
          fontFamily: "Noto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow ? (
            <div style={{ fontSize: 30, fontWeight: 700, color: "#5fcdee", marginBottom: 26 }}>
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              fontSize: titleSize ?? titleSizeFor(title),
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.035em",
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          {footnote ? (
            <div style={{ fontSize: 32, fontWeight: 400, color: "#a3a7ac", marginTop: 28 }}>
              {footnote}
            </div>
          ) : null}
        </div>

        {/*
          아래 한 줄 — 왼쪽에 누구의 글인지, 오른쪽에 언제인지.

          워드마크는 화면 헤더와 같은 형태다. 카드가 타임라인에서 손톱만 해져도
          점 하나가 악센트라 어느 사이트인지 알아본다.

          날짜는 오른쪽 끝에 흐리게 둔다. 제목 위에 얹어 보려다 뒀다 —
          위쪽은 제목이 화면을 다 쓰라고 비워 둔 자리이고, 날짜는 먼저 읽을 것이 아니다.
        */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 700 }}>
            <span style={{ color: "#ffffff", letterSpacing: "0.02em" }}>CHANBIN</span>
            <span style={{ color: "#5fcdee" }}>.</span>
          </div>
          {meta ? (
            <div style={{ fontSize: 28, fontWeight: 400, color: "#8b9095" }}>{meta}</div>
          ) : null}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
