import type { Metadata } from "next";
import { LinkIcon } from "@/components/icons";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Guestbook } from "@/features/about/components/Guestbook";
import { ACTIVITIES, IDENTITY, INTRO, PROJECTS, type TimelineItem } from "./data";

export const metadata: Metadata = {
  title: "About",
  description: "앱과 웹을 만드는 개발자 박찬빈입니다. 만든 것과 활동, 그리고 방명록이 있습니다.",
  alternates: { canonical: "/about" },
};

/**
 * 소개 (ADR-0038·0041).
 *
 * 명함 → 짧은 소개 → 만든 것 → 활동 → 방명록.
 * 읽는 화면이라 본문과 같은 폭을 쓴다. 이전에는 1080px 에 칩과 카드를 늘어놓은
 * 훑는 화면이었는데, 그건 포트폴리오가 하는 일이었다.
 *
 * 한때 "지금" 절을 뒀다가 뺐다. 내용이 좋아도 사람이 손으로 고쳐야 하는 절은
 * 결국 안 고치게 되고, 안 고쳐진 "지금"은 있는 것보다 나쁘다.
 * 시기가 적힌 목록은 그 문제가 없다 — 지나간 것은 지나간 대로 남는다.
 *
 * 수상은 넣지 않는다. 여기는 무엇을 해왔는지 말하는 자리이고 상은 포트폴리오가 한다.
 * 대신 목록 끝에서 포트폴리오로 넘긴다 — 두 곳에서 같은 말을 하지 않으면서
 * 더 보고 싶은 사람에게 갈 곳을 준다.
 *
 * 사이트를 어떻게 만들었는지(노션 동기화·R2·ADR)를 적었다가 뺐다.
 * 만든 사람에게는 재미있는 이야기지만 읽으러 온 사람이 궁금해하는 것은 아니다.
 * 그 이야기는 글로 쓰면 된다.
 *
 * 마지막은 방명록이다(ADR-0041). 소개는 한 사람에 대해 읽는 자리라,
 * 다 읽고 나면 한마디 남기고 싶어지는 곳이 마지막에 있는 편이 자연스럽다.
 */
export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[var(--container-prose)] px-6 pb-8 pt-16 sm:pt-20">
      <SectionTitle as="h1">about</SectionTitle>

      {/*
        명함. 이름과 갈 곳을 한 상자에 모은다.
        흩어 두면 "연락처" 절을 따로 만들어야 하는데, 위에 모으면 처음 온 사람이
        누구이고 어디로 가면 되는지를 먼저 안다.
      */}
      <section className="mt-10 rounded-[18px] bg-surface-hover px-6 py-7 sm:px-8">
        <p className="text-[21px] font-bold tracking-[-0.02em]">
          {IDENTITY.name}
          <span className="ml-3 font-display text-[13px] font-bold uppercase tracking-[0.14em] text-muted">
            {IDENTITY.nameEn}
          </span>
        </p>
        <p className="mt-2 text-[15px] text-muted">
          {IDENTITY.role} · {IDENTITY.affiliation}
        </p>

        {/*
          라벨을 값 위에 얹고 셋을 나란히 둔다.
          앞서 라벨을 왼쪽 고정 폭(74px)에 두었더니 "PORTFOLIO" 가 두 줄로 접혔다.
          글자 길이에 맞춰 칸을 고정하면 항목 이름이 바뀔 때마다 다시 깨진다.

          값에 truncate 를 걸었던 것도 뺐다. 넘침을 감추면 글자 아래에 그려지는 번개 밑줄까지
          함께 잘려 나간다 — 밑줄이 이상하게 보이던 원인이다.
        */}
        <ul className="mt-6 grid gap-x-8 gap-y-5 border-t border-hairline pt-6 sm:grid-cols-3">
          {IDENTITY.links.map(({ label, value, href }) => {
            const external = href.startsWith("http");
            return (
              <li key={label} className="min-w-0">
                <span className="block font-display text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                  {label}
                </span>
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-baseline gap-1 text-[15px] transition-colors hover:text-accent-text"
                >
                  <span className="spark-line break-all">{value}</span>
                  {external && <LinkIcon size={14} className="shrink-0 translate-y-px" />}
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="prose mt-12">
        {INTRO.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <section className="mt-20">
        <SectionTitle>projects</SectionTitle>
        <Timeline items={PROJECTS} />
        <a
          href="https://portfolio.chanbin.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-baseline gap-1 text-[15px] text-muted transition-colors hover:text-accent-text"
        >
          <span className="spark-line">자세한 이야기는 포트폴리오에</span>
          <LinkIcon size={14} className="shrink-0 translate-y-px" />
        </a>
      </section>

      <section className="mt-20">
        <SectionTitle>activities</SectionTitle>
        <Timeline items={ACTIVITIES} />
      </section>

      {/*
        방명록. `writing` 절(이 블로그에 무엇을 쓰는지)이 있던 자리다.
        그건 읽으러 온 사람이 궁금해하는 것이 아니라 쓰는 사람의 다짐에 가까웠고,
        어차피 글 목록을 보면 무엇을 쓰는지 안다. 대신 남기고 갈 자리를 뒀다.
      */}
      <section className="mt-20">
        <Guestbook />
      </section>
    </div>
  );
}

/**
 * 시기가 붙은 목록.
 *
 * 시기를 왼쪽 칸에 고정하면 눈이 한 줄로 내려가며 언제인지를 먼저 훑을 수 있다.
 * 좁은 화면에서는 칸을 나누지 않고 시기를 이름 위에 얹는다 —
 * 8.5rem 을 떼어 주면 이름이 두 줄로 접힌다.
 *
 * 한 항목은 이름 + "무엇인지" + "무엇을 맡았는지" 세 조각이다. 문장은 쓰지 않는다.
 * 맡은 것은 한 칸 띄고 흐리게 둔다 — 같은 줄에 두면 눈이 어디서 끊어야 할지 모르고,
 * 줄을 나누면 목록이 다섯 항목이 아니라 열다섯 줄로 보인다.
 *
 * 세로 레일과 점은 두지 않았다. 시기가 이미 왼쪽에 줄지어 서 있어서
 * 선을 더 그으면 같은 말을 두 번 하는 것이 된다.
 */
function Timeline({ items }: { items: readonly TimelineItem[] }) {
  return (
    <ol className="mt-9 flex flex-col gap-7">
      {items.map((item) => (
        <li key={item.name} className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-6">
          <span className="pt-[3px] font-display text-[13px] font-semibold tabular-nums text-muted">
            {item.period}
          </span>
          <div>
            <p className="text-[17px] font-bold tracking-[-0.01em]">{item.name}</p>
            <p className="mt-1.5 text-[15px] leading-[1.7] text-prose-fg">
              {item.what}
              <span className="text-muted"> · {item.role}</span>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
