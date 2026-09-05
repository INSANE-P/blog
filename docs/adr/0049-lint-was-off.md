# ADR-0049: 린트가 꺼져 있었다

- 상태: 채택
- 날짜: 2026-09-05
- 관련: ADR-0022(노션 전환)

## 무슨 일이 있었나

`next build` 로그에 이 줄이 계속 있었다.

```
⨯ ESLint: Failed to load plugin 'react-hooks' declared in ' » eslint-config-next/core-web-vitals':
  Cannot find module 'eslint-plugin-react-hooks'
```

**빌드는 통과했다.** Next 는 린트 실패를 경고로만 찍고 넘어간다.
그래서 몇 주 동안 린트가 한 줄도 돌지 않는 채로 배포가 계속됐다.

## 원인

`eslint-config-next` 는 플러그인 일곱 개를 자기 의존성으로 끌어온다.
그런데 eslint 는 그것들을 **설정 파일이 있는 자리**(저장소 루트)에서 찾는다.

pnpm 은 남의 의존성을 보지 못하게 막는다 — 그래서 유령 의존성이 안 생긴다.
그 격리와 eslint 의 탐색 방식이 부딪혀 플러그인을 하나도 못 찾았다.

## 결정

**필요한 플러그인을 우리 devDependencies 에 직접 적었다.**

`.npmrc` 의 `public-hoist-pattern` 으로도 되고 실제로 먼저 그렇게 해 봤지만,
그건 pnpm 의 격리를 통째로 푸는 쪽이고 "왜 여기 있는지"가 파일에 남지 않는다.
필요한 것만 명시하면 다음 사람이 `package.json` 만 보고 안다.

**`next lint` 대신 `eslint .` 를 쓴다.** `next lint` 는 Next 16 에서 없어진다.
어차피 손볼 자리라 지금 옮겼다. 규칙 묶음(`next/core-web-vitals`)은 그대로 쓴다 —
직접 조립하면 규칙을 잃는다.

## 켜자마자 잡힌 것

```
ThemeToggle.tsx  'at' is assigned a value but never used
Markdown.tsx     Unused eslint-disable directive
Markdown.tsx     Using `<img>` could result in slower LCP
```

세 번째가 재미있다. `<img>` 를 쓰는 것은 의도한 결정인데(그림은 R2 에서 오고 치수를 이미 안다),
`eslint-disable` 주석이 **한 줄 위에 붙어 있어 정작 `<img>` 를 못 덮고 있었다.**
그래서 첫 번째 경고("쓸모없는 disable")와 세 번째 경고가 동시에 났다.
린트가 돌았다면 붙이는 순간 알았을 일이다.

## 교훈

**경고로만 찍히는 실패는 실패로 보이지 않는다.** 빌드가 초록색이면 아무도 로그를 읽지 않는다.
검사 스크립트를 따로 둔 이유(ADR-0044)와 같은 이야기다 —
지키고 싶은 것이 있으면 실패했을 때 **시끄럽게** 만들어야 한다.
