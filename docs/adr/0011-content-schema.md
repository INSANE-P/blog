# ADR-0011: 콘텐츠 DB 스키마

- 상태: 일부 대체됨(ADR-0022 — 글의 종류·핀 제거, 태그는 배열로)
- 날짜: 2026-06-18

## 맥락 (Context)

[ADR-0005](0005-content-model.md)에서 앱의 콘텐츠 모델(`Entry`)을 정했다. 이제 그 모델을 Supabase(Postgres)로 옮긴다. 초기 스키마([0001_init.sql](../../supabase/migrations/0001_init.sql))는 글 한 종류만 다뤘는데, 우리는 기록·이야기 두 흐름과 홈 큐레이션·날짜 중심 기록을 담아야 한다.

## 결정 (Decision)

- **한 `posts` 테이블 + `type`(journal/post)으로 두 흐름을 구분한다.** 별도 테이블로 나누지 않는다(ADR-0005와 일관).
- **`featured`(홈 핀), `entry_date`(표시 날짜)를 더한다.** 기록은 날짜가 주인공이라 `entry_date`로 정렬·표시한다.
- **본문은 Tiptap 문서를 `jsonb`로 저장한다.** HTML 문자열이 아니라 구조화된 JSON.
- **상태는 `draft`/`published`, RLS로 보호한다.** 방문자는 published만 읽고, 쓰기/수정/삭제는 인증 사용자만(0001 정책 유지).
- **태그는 `tags`/`post_tags` 조인.** 글마다 자유롭게 붙인다.

## 이유 (Rationale)

- 두 흐름이 같은 컬럼을 쓰므로 한 테이블 + 구분 컬럼이 단순하다. 상세·에디터도 공유한다.
- Tiptap JSON으로 저장하면 렌더러를 바꿔도(HTML·요약·검색 인덱스 등) 원본이 안정적이다. HTML 문자열은 다루기 까다롭고 XSS에 취약하다.
- RLS를 DB 레벨에 두면 클라이언트가 무엇을 호출하든 published만 노출되고, 쓰기는 로그인 없이는 불가능하다 — 앱 코드 실수와 무관하게 안전하다.

## 고려한 대안 (Alternatives)

- **기록·이야기를 별도 테이블로** — 명확하지만 쿼리·레이아웃이 두 배가 돼 기각(ADR-0005).
- **본문을 HTML/Markdown 문자열로** — 단순하지만 구조 변환·보안이 번거로워 Tiptap jsonb로.

## 결과 (Consequences)

- 스키마: `supabase/migrations/0001_init.sql`(기본·RLS) + `0002_app_model.sql`(type·featured·entry_date)
- 예시 데이터: `supabase/seed.sql`
- 후속: 읽기 연결(queries mock→DB), 어드민 글쓰기(Tiptap), 본문 렌더, 불 지피기 영속화는 각각 별도 이슈.
