"use client";

import { useState } from "react";
import { youTubeId } from "./youtube-id";

/**
 * 유튜브 (ADR-0051).
 *
 * 영상을 링크로만 두면 아무도 누르지 않는다. 그렇다고 `<iframe>` 을 바로 심으면
 * 유튜브의 스크립트 묶음이 문서와 함께 내려온다 — 한 편에 1MB 가까이 되고,
 * 읽기만 하고 재생하지 않는 사람이 대부분인데 그 값을 모두가 치른다.
 *
 * 그래서 **누르기 전에는 그림 한 장**만 둔다. 썸네일과 재생 단추를 우리가 그리고,
 * 누른 뒤에야 `<iframe>` 을 끼운다. 안 누르면 비용은 이미지 하나다.
 *
 * `youtube-nocookie.com` 을 쓴다. 재생하기 전까지는 유튜브가 방문자를 알 수 없고,
 * 재생한 뒤에도 추적 쿠키를 덜 남긴다. 읽으러 온 사람에게 그 대가를 미리 물릴 이유가 없다.
 *
 * 썸네일은 유튜브에서 바로 받는다. 우리 R2 로 옮길 수도 있지만, 그러면 동기화가
 * 유튜브 주소를 따라다니며 그림을 굽는 일까지 해야 한다 — 영상 하나 붙이자고
 * 동기화에 새 실패 지점을 만들 이유가 없다.
 */
export { youTubeId };

export function YouTube({ id, title }: { id: string; title?: string }) {
  const [playing, setPlaying] = useState(false);
  const label = title || "유튜브 영상";

  return (
    <div className="not-prose my-9 overflow-hidden rounded-[14px] border border-hairline bg-surface-hover">
      <div className="relative aspect-video">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`${label} 재생`}
            className="group absolute inset-0 size-full cursor-pointer"
          >
            {/*
              썸네일. `hqdefault` 는 어느 영상에나 있다 —
              `maxresdefault` 는 없는 영상이 있어 깨진 그림이 남는다.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              aria-hidden
              loading="lazy"
              className="size-full object-cover"
            />
            {/*
              재생 단추. 유튜브의 빨간 단추를 그대로 쓰지 않는다 —
              이 화면에서 빨강은 어디에도 없어서 혼자 튄다.
              대신 우리 악센트로 그리고, 흐린 막을 깔아 어떤 썸네일 위에서도 보이게 한다.
            */}
            <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
            <span className="absolute left-1/2 top-1/2 flex size-[62px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent shadow-[0_4px_18px_rgba(0,0,0,0.35)] transition-transform group-hover:scale-110">
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden className="ml-[3px]">
                <path d="M7 4.5v15l13-7.5z" fill="#000" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
