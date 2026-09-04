-- 0006: 노션을 글의 정본으로 삼기 위한 스키마 변경 (ADR-0022)
-- 동기화가 노션 페이지를 posts로 upsert 한다. upsert 기준은 notion_page_id.
-- 여러 번 실행해도 안전하도록 if not exists / if exists 로 감싼다.

-- 노션 페이지의 안정 키.
-- 제목·슬러그가 바뀌어도 이 값은 그대로라, 리액션(stokes)이 고아가 되지 않는다.
alter table public.posts
  add column if not exists notion_page_id text;

-- upsert 대상을 이 컬럼으로 찾으므로 유일해야 한다.
-- 기존 행(노션에서 오지 않은 글)은 null 이며, null 은 unique 제약에 걸리지 않는다.
create unique index if not exists posts_notion_page_id_key
  on public.posts (notion_page_id)
  where notion_page_id is not null;

-- 동기화가 마지막으로 성공한 시각. 운영 중 문제 추적용.
alter table public.posts
  add column if not exists synced_at timestamptz;

comment on column public.posts.notion_page_id is
  '노션 페이지 ID. 동기화 upsert 의 기준 키(ADR-0022).';
comment on column public.posts.synced_at is
  '마지막 노션 동기화 성공 시각.';
