# ADR-0018: 에디터 출력과 리더 렌더의 마크다운 호환

- 상태: 대체됨(ADR-0022)
- 날짜: 2026-06-21

## 맥락 (Context)

작성은 Crepe(에디터, [ADR-0015](0015-editor-milkdown.md)), 표시는 react-markdown([ADR-0014](0014-markdown-content.md))으로 분리돼 있다. 둘의 마크다운이 100% 같지 않아, Crepe가 내는 일부 출력이 공개 화면에서 그대로 렌더되지 않았다.

- **하드 줄바꿈** → Crepe가 `<br />`(HTML)로 저장 → 리더는 원시 HTML을 렌더하지 않아 **글자 그대로** 보임.
- **수식(LaTeX)** → Crepe가 `$...$`·`$$...$$`로 저장 → 리더에 math 플러그인이 없어 **글자 그대로** 보임.

리더는 XSS 안전을 위해 **원시 HTML 렌더를 끈 채로 둔다**(rehype-raw 미사용)는 게 [ADR-0014]의 전제다.

## 결정 (Decision)

- **줄바꿈**: 본문의 `<br>`만 마크다운 하드 브레이크(공백 2 + 줄바꿈)로 **변환**한다. 원시 HTML 렌더는 계속 끈다.
- **수식**: 리더에 **`remark-math` + `rehype-katex`** 를 추가해 수식을 정식 렌더한다(katex CSS 포함).

## 이유 (Rationale)

- `rehype-raw`로 원시 HTML 전체를 켜면 모든 HTML이 렌더돼 **정화(sanitize) 부담·XSS 표면**이 생긴다. 실제로 깨지는 건 `<br>` 하나라, **그것만 안전하게 변환**하는 게 비용 대비 안전하다.
- 수식은 에디터가 제공하는 기능이므로, 리더도 지원해 **작성=표시 일관성**을 맞춘다. 격리된 기능이라 추가 비용도 작다.

## 트레이드오프 (Trade-off)

- katex CSS(~23KB)가 본문 경로에 상시 포함된다. 수식 렌더 자체는 서버(RSC)에서 일어나 무거운 katex JS는 클라이언트로 안 나간다.
- `remark-math`는 본문의 `$` 표현(예: `$5`)을 수식으로 오인할 여지가 있다 — 드물고, 필요 시 이스케이프(`\$`)로 회피.

## 결과 (Consequences)

- `lib/content/Markdown.tsx`: `<br>` 정규화 + `remark-math`/`rehype-katex` 추가.
- 의존성: `remark-math`, `rehype-katex`, `katex`.
- 원시 HTML 렌더는 여전히 비활성 — XSS 안전 유지.
