-- Flagship content fix (owner-approved): give The Food List a website link.
-- Additive, nullable column on Eric's public.restaurants table. Brings it to
-- parity with members.food_items (which already has `link`). No other public.*
-- table is touched.
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS link TEXT;
