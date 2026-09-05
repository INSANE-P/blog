"use client";

import Giscus from "@giscus/react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useGiscusTheme } from "@/lib/giscus";

/**
 * 댓글 (ADR-0021·0028·0029).
 *
 * Giscus — 저장은 GitHub Discussions, 우리 백엔드 0. 설정값(repo-id·category-id)은 공개라
 * 하드코딩해도 안전하다.
 *
 * 처음에는 표식 타일 + 제목 + 부제목을 얹었다가 걷어냈다. 아이콘 타일에 두 줄을 붙인 모양은
 * 어느 서비스에나 있는 빈 상태 패턴이라 이 사이트의 것으로 읽히지 않았고, 무엇보다
 * giscus 가 이미 댓글 쓴 사람들의 얼굴을 보여 준다 — 그 위에 표식을 또 얹으면 얼굴이 둘이 된다.
 *
 * 대신 홈의 절 제목을 그대로 쓴다(아웃라인 대문자 + 한글 한 줄). 화면마다 다른 방식으로
 * 제목을 다는 것이 "직접 만든 것처럼" 보이지 않게 하는 가장 큰 원인이다.
 *
 * 테마 판단은 소개의 방명록과 같아서 `useGiscusTheme` 으로 뺐다.
 */
export function Comments() {
  const theme = useGiscusTheme("giscus");

  return (
    <section aria-label="댓글">
      <SectionTitle>comments</SectionTitle>
      <p className="mt-2 text-[15px] text-muted">자유롭게 생각을 남겨주세요.</p>

      <div className="mt-7">
        {/*
          key 에 테마를 넣어 테마가 바뀌면 위젯을 새로 만든다.

          giscus 는 첫 렌더 이후 속성이 바뀌면 iframe 을 다시 그리지 않고 postMessage 로만
          알린다(`requestUpdate` → `updateConfig`). 그런데 그 메시지를 보내는 `sendMessage` 는
          iframe 이 아직 로드되지 않았으면 **조용히 버린다**. 우리는 loading="lazy" 라
          댓글이 화면 밖일 때 토글하면 그 변경이 그대로 사라진다. iframe 의 src 에는
          처음 테마가 박혀 있으므로 나중에 로드돼도 옛 테마로 뜬다.

          새로 만들면 src 에 지금 테마가 담긴 채로 뜨므로 이 경로를 아예 타지 않는다.
        */}
        <Giscus
          key={theme}
          repo="INSANE-P/frost-log"
          repoId="R_kgDOS4XX0g"
          category="댓글"
          categoryId="DIC_kwDOS4XX0s4C_-zB"
          mapping="pathname"
          strict="1"
          reactionsEnabled="0"
          emitMetadata="0"
          inputPosition="bottom"
          theme={theme}
          lang="ko"
          loading="lazy"
        />
      </div>
    </section>
  );
}
