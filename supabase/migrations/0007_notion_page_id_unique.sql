-- 0007: notion_page_id 를 부분 인덱스에서 일반 unique 제약으로 바꾼다
--
-- 0006 에서는 "노션에서 오지 않은 기존 글은 null 이니 걸리지 않게" 하려고
-- where notion_page_id is not null 부분 인덱스를 썼다. 의도는 맞았지만
-- PostgreSQL 의 ON CONFLICT 는 부분 인덱스를 추론하지 못해 upsert 가 실패한다.
--   there is no unique or exclusion constraint matching the ON CONFLICT specification
--
-- 노션 전환으로 기존 글을 모두 지웠으므로 부분 인덱스를 유지할 이유도 사라졌다.
-- 일반 unique 제약에서도 null 은 서로 충돌하지 않으므로(표준 SQL), 안전하다.

drop index if exists posts_notion_page_id_key;

alter table public.posts
  drop constraint if exists posts_notion_page_id_unique;

alter table public.posts
  add constraint posts_notion_page_id_unique unique (notion_page_id);
