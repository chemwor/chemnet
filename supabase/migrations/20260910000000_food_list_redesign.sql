-- ════════════════════════════════════════════════════════════════════════
-- Food List redesign · meal photos + links (ADDITIVE — schema parity)
-- ════════════════════════════════════════════════════════════════════════
-- members.food_items is canonical; public.restaurants mirrors it. Both already
-- have `review`, a `link` (restaurants from 20260901; food_items added below),
-- and allow the 'cook' status. This only adds photo galleries (+ link on the
-- member side). No existing public.* column is altered; no other table touched.
-- ════════════════════════════════════════════════════════════════════════

-- Member side (canonical): link + photo gallery. 'cook' already allowed (no check).
alter table members.food_items add column if not exists link       text;
alter table members.food_items add column if not exists photo_urls text[] not null default '{}';

-- Flagship mirror: photo gallery (link + review already exist; 'cook' already in the check).
alter table public.restaurants add column if not exists photo_urls text[] not null default '{}';
