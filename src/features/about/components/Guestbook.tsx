"use client";

import Giscus from "@giscus/react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useGiscusTheme } from "@/lib/giscus";

/**
 * 방명록 (ADR-0041).
 *
 * 소개 페이지의 마지막 절. 저장은 글의 댓글과 같은 giscus 지만,
 * `mapping="specific"` 으로 "방명록" 이라는 한 개의 토론에 모은다 —
 * 경로로 묶으면 나중에 소개 페이지 주소가 바뀔 때 남긴 글이 통째로 흩어진다.
 *
 * 겉모습은 댓글과 일부러 다르게 간다(`giscus-guestbook-*.css`).
 * 글 아래의 댓글은 방금 읽은 것에 대한 대답이라 말풍선이 맞지만,
 * 방명록은 지나간 사람이 남기고 간 쪽지에 가깝다. 같은 위젯이라도
 * 하는 일이 다르면 다르게 보여야 온 사람이 무엇을 하는 자리인지 안다.
 *
 * 반응과 답글 표시는 CSS 에서 지운다. 방명록은 주고받는 자리가 아니다.
 */
export function Guestbook() {
  const theme = useGiscusTheme("giscus-guestbook");

  return (
    <section aria-label="방명록">
      <SectionTitle>guestbook</SectionTitle>
      <p className="mt-2 text-[15px] text-muted">와주셔서 감사합니다. 아무 말이나 남겨주세요.</p>

      <div className="mt-7">
        {/* 테마가 바뀌면 위젯을 새로 만든다 — 이유는 Comments 쪽에 적어 뒀다 */}
        <Giscus
          key={theme}
          repo="INSANE-P/frost-log"
          repoId="R_kgDOS4XX0g"
          category="댓글"
          categoryId="DIC_kwDOS4XX0s4C_-zB"
          mapping="specific"
          term="방명록"
          strict="0"
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
