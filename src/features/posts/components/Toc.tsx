"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "@/components/icons";
import type { Heading } from "@/lib/content/headings";

const STORAGE_KEY = "toc:open";

/** 목차를 옆에 띄울 만큼 화면이 넓은지 — 본문 44rem 양옆에 패널이 들어갈 여유 */
const WIDE = "(min-width: 1280px)";

/**
 * 목차 (ADR-0025·0027·0039).
 *
 * 절이 넷 이상일 때만 보여 준다. 두세 개짜리 글에서는 목차가 정보가 아니라
 * 본문 앞을 가로막는 장애물이 된다.
 *
 * 넓은 화면과 좁은 화면에서 **다른 물건**을 쓴다. 같은 목록을 폭만 바꿔 재활용하면
 * 한쪽은 반드시 어색해진다 — 옆에 세워 두는 목차와 손가락으로 누르는 목차는
 * 필요한 것이 다르다.
 */
export function Toc({ headings }: { headings: Heading[] }) {
  const [wide, setWide] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (headings.length < 4) return;
    /*
      화면 위쪽 1/3 안에 들어온 제목 중 마지막 것을 "지금 절"로 본다.
      가운데를 기준으로 잡으면 절이 짧을 때 표시가 건너뛰고,
      맨 위를 기준으로 잡으면 제목이 지나가자마자 다음으로 넘어간다.
    */
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
        const visible = headings.filter((h) => seen.get(h.id));
        if (visible.length > 0) {
          setActive(visible[visible.length - 1].id);
          return;
        }
        /*
          띠 안에 제목이 하나도 없을 때가 두 가지다.
          첫 제목보다 위(표지와 머리말을 보는 중)라면 아직 어느 절도 아니다 — 비운다.
          그게 아니라면 긴 절 한가운데를 지나는 중이므로 직전 값을 그대로 둔다.
          구분하지 않고 마지막 값을 붙들면, 글 맨 위로 돌아와 표지를 보고 있는데도
          첫 절에 불이 들어와 있다.
        */
        const first = document.getElementById(headings[0].id);
        if (first && first.getBoundingClientRect().top > 88) setActive(null);
      },
      { rootMargin: "-88px 0px -67% 0px" },
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [headings]);

  if (headings.length < 4) return null;
  return wide ? <TocPanel headings={headings} active={active} /> : <TocSheet headings={headings} />;
}

/**
 * 넓은 화면 — 본문 오른쪽 여백에 고정한다.
 *
 * 위치는 화면 오른쪽이 아니라 **본문 오른쪽 끝** 기준이다.
 * `left: calc(50% + 24rem)` 은 본문 절반(22rem) 에 여백 2rem 을 더한 값이라
 * 창을 넓혀도 본문과의 간격이 32px 로 고정된다.
 * 오른쪽 끝 기준으로 잡았다가 1280px 에서 본문 위로 58px 파고든 적이 있다.
 *
 * 진행은 **목록 글자 자체로** 말한다. 지나온 절은 본문 색으로 차 있고, 아직 안 읽은 절은
 * 흐리고, 지금 절에는 번개 밑줄이 그어진다. 헤더의 현재 메뉴와 같은 표시라(ADR-0030)
 * "여기 있음"이 사이트 안에서 한 가지 뜻으로 읽힌다.
 *
 * 앞서 레일에 진행 바를 그렸다가 걷어냈다. 목록 옆에 막대와 불꽃을 세우면 장치가 하나 더
 * 생기는데, 목록은 이미 다섯 줄로 위치를 말할 수 있다. 번호를 아웃라인에서 채움으로 바꾸는
 * 안도 봤지만 11px 에서 1px 획이 뭉개져 망가진 글자로 보였다 — ADR-0024 에 적어 둔 그대로다.
 *
 * 접을 수 있다. 읽는 동안 옆에 뭔가 떠 있는 것이 거슬리는 사람이 있고 그건 취향이라,
 * 고르게 두고 브라우저에 기억한다.
 *
 * 접어도 머리줄은 제자리에 남는다. 여닫는 단추가 상태에 따라 자리를 옮기면
 * 방금 누른 곳을 다시 찾아야 한다 — 접기와 펴기는 같은 자리의 같은 단추여야 한다.
 * 아이콘도 ✕ 가 아니라 꺾쇠다. ✕ 는 "없앤다"로 읽히는데 여기서 하는 일은 접기이고,
 * 꺾쇠는 돌아간 방향이 다음에 일어날 일을 그대로 가리킨다.
 */
function TocPanel({ headings, active }: { headings: Heading[]; active: string | null }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(STORAGE_KEY) !== "0");
    } catch {
      // 접근 불가(시크릿 등)면 기본값(열림)으로 둔다
    }
  }, []);

  const remember = (next: boolean) => {
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // 저장 못 해도 이번 방문 동안은 동작한다
    }
  };

  const here = headings.findIndex((h) => h.id === active);

  return (
    <nav
      aria-label="목차"
      className="fixed left-[calc(50%+24rem)] top-[128px] z-30 w-[13rem] print:hidden"
    >
      {/* 머리줄 전체가 단추다 — 라벨까지 눌리면 겨냥할 것이 커진다 */}
      <button
        type="button"
        onClick={() => remember(!open)}
        aria-expanded={open}
        aria-label={open ? "목차 접기" : "목차 펼치기"}
        className="group flex w-full items-center justify-between gap-2 py-1 text-left"
      >
        <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted transition-colors group-hover:text-foreground">
          목차
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-muted transition-[transform,color] duration-300 ease-[cubic-bezier(0.22,0.8,0.3,1)] group-hover:text-foreground ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`toc-collapse ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="mt-3 max-h-[calc(100dvh-210px)] overflow-y-auto">
            <ul className="flex flex-col">
              {headings.map((h, i) => {
                const on = active === h.id;
                // 지금 절보다 앞에 있으면 지나온 절이다
                const done = here >= 0 && i < here;
                return (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      title={h.text}
                      aria-current={on ? "location" : undefined}
                      className={`block py-[9px] text-[14px] leading-[1.4] transition-colors ${
                        on
                          ? "font-semibold text-accent-text"
                          : done
                            ? "text-prose-fg hover:text-accent-text"
                            : "text-muted hover:text-accent-text"
                      }`}
                    >
                      {/*
                        `spark-line` 은 지금 절이 아니어도 늘 붙여 둔다. 클래스와 `data-here` 를
                        같은 순간에 붙이면 `::after` 가 그때 처음 생기느라 출발값이 없어
                        전환이 통째로 건너뛴다 — 밑줄이 그어지지 않고 이미 그어진 채로 나타난다.
                        재 봤더니 0ms 부터 끝까지 `inset(0)` 이었다.
                        클래스를 미리 깔아 두면 100% → 0 으로 왼쪽에서 오른쪽으로 그어진다.

                        곁들여, 호버하면 그 항목에도 밑줄이 지나간다 — 헤더 메뉴와 같은 거동이다.
                      */}
                      <span className="spark-line" data-here={on || undefined}>
                        {h.text}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * 좁은 화면 — 본문 흐름에 두되 **접어 둔다**.
 *
 * 펼친 채로 두면 커버와 첫 문단 사이를 목록이 가로막아, 읽으러 온 사람이
 * 읽기 전에 넘겨야 하는 것이 생긴다. 손가락으로 넘기는 화면에서는 그 대가가 더 크다.
 * 그래서 기본은 접힘이고, 필요할 때만 연다.
 *
 * 목록은 옆 패널 것을 그대로 쓰지 않는다.
 *   - 번호를 붙인다. 좁은 폭에서는 제목이 두 줄로 접히므로 항목이 어디서 시작하는지
 *     알려 줄 표가 필요하다. 모바일 메뉴(ADR-0033)와 같은 `01` 꼴이라 뜻이 이어진다.
 *   - 한 줄 높이를 44px 이상으로 잡는다. 손가락은 커서보다 뭉툭하다.
 *   - 절 개수는 적지 않는다. "5개 절" 은 한국어로 읽으면 어색하고, 열어 볼지 말지를
 *     정하는 데 큰 도움도 안 된다. 접힌 막대는 "목차"와 꺾쇠만으로 충분히 읽힌다.
 *   - 지금 절은 표시하지 않는다. 접혀 있는 동안에는 보이지 않고,
 *     좁은 화면에는 맨 위 진행 바가 그 일을 한다.
 *
 * 눌러도 닫지 않는다. 처음에는 닫게 해 뒀는데, 닫을 이유가 없었다.
 * 이 시트는 화면을 덮는 물건이 아니라 글 흐름 안에 있다. 누르면 한참 아래로 내려가므로
 * 열려 있든 닫혀 있든 보이지 않고, 대신 다시 올라와 다른 절로 갈 때 또 열어야 한다.
 *
 * (닫으면 목록이 접힌 만큼 문서가 위로 밀려 앵커가 어긋나지 않을까 싶어 재 봤는데,
 *  브라우저의 스크롤 앵커링이 보정해서 도착 위치는 84px 로 같았다. 그건 이유가 아니었다.)
 */
function TocSheet({ headings }: { headings: Heading[] }) {
  const [open, setOpen] = useState(false);

  return (
    <nav aria-label="목차" className="mt-9 overflow-hidden rounded-[14px] bg-surface-hover">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">
          목차
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* 옆 패널과 같은 방식으로 편다 — 높이를 재지 않고 grid 행으로 */}
      <div className={`toc-collapse ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <ul className="border-t border-hairline px-2 pb-2">
            {headings.map((h, i) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  tabIndex={open ? undefined : -1}
                  className="flex min-h-[44px] items-baseline gap-3.5 rounded-[10px] px-3 py-2.5 text-[15px] leading-[1.5] text-prose-fg active:bg-background"
                >
                  <span className="font-display text-[11px] font-bold tabular-nums text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
