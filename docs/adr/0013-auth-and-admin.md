# ADR-0013: 인증과 어드민 보호

- 상태: 대체됨(ADR-0022)
- 날짜: 2026-06-18

## 맥락 (Context)

글쓰기는 소유자(나)만 할 수 있어야 한다. 공개 블로그라 공개키(publishable)는 누구나 가질 수 있는데, 그 키로는 읽기만 되고 쓰기는 막혀야 한다.

## 결정 (Decision)

- **진짜 잠금은 DB RLS** — 쓰기/수정/삭제는 인증 사용자만(0001 정책). 공개키로는 못 쓴다.
- **공개 회원가입을 끈다** — 소유자 계정 1개만 수동 생성. 그래서 "인증 사용자" = 나.
- **로그인/로그아웃은 Server Action + Zod** 입력 검증(ADR-0002).
- **`(admin)` 레이아웃에서 세션을 확인**해 미로그인 시 `/login`으로 보낸다(UX 가드).

## 이유 (Rationale)

- RLS가 DB 레벨에서 막으면, 앱 코드 실수나 키 노출과 무관하게 안전하다 — 공개키는 사실상 읽기 전용처럼 동작한다.
- 회원가입을 열어두면 누구나 인증 사용자가 될 수 있으니, 끄는 게 "나만"의 핵심이다.
- 앱 가드는 보안 경계가 아니라 편의다 — 잠금은 항상 RLS가 한다.

## 고려한 대안 (Alternatives)

- **앱 코드로만 막기(RLS 없이)** — 클라이언트가 공개키로 DB를 직접 칠 수 있어 위험, 기각.
- **RLS를 내 user id로 한정** — 더 단단하지만, 회원가입 끄기 + 단일 계정으로 충분. 필요 시 후속 강화.

## 결과 (Consequences)

- 인증: `src/features/auth/actions.ts`, `LoginForm.tsx`
- 로그인: `src/app/login/page.tsx`
- 보호: `src/app/(admin)/layout.tsx`, `(admin)/admin/page.tsx`
- 잠금: DB RLS(`supabase/migrations/0001_init.sql`) + Supabase 공개 회원가입 OFF
