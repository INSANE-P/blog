-- 0008: 태그를 posts.tags 배열로 옮기고 tags/post_tags 테이블을 없앤다
--
-- 정규화(tags + post_tags)의 이점은 이름 일괄 변경, 글 수 집계, 조인 필터링인데
-- 셋 다 쓰지 않는다. 태그 페이지도 글이 쌓일 때까지 미뤘으므로 남는 용도는
-- "글에 태그 이름 표시"뿐이고, 그건 배열로 충분하다.
--
-- 나중에 필터링이 필요해지면 GIN 인덱스로 tags @> ARRAY['회고'] 조회가 된다.
-- 그리고 노션이 정본이라, 구조를 되돌리고 싶으면 스키마를 바꾸고 동기화를 한 번 돌리면 된다.

alter table public.posts
  add column if not exists tags text[] not null default '{}';

-- 필터링을 나중에 붙일 때를 위한 인덱스. 지금 만들어도 비용이 거의 없다.
create index if not exists posts_tags_gin_idx
  on public.posts using gin (tags);

comment on column public.posts.tags is
  '태그 이름 배열. 노션 태그 속성을 그대로 담는다(ADR-0022).';

-- 조인 테이블과 태그 테이블 제거.
-- 노션이 정본이므로 여기 있던 데이터는 동기화로 다시 채워진다.
drop table if exists public.post_tags;
drop table if exists public.tags;
