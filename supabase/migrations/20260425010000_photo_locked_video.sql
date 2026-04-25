-- Optional locked video on a photo entry. The video shows in the
-- slideshow as a final slide gated behind a code. The unlock_hint
-- is displayed to the viewer; unlock_code is matched case-insensitively.
ALTER TABLE photos ADD COLUMN IF NOT EXISTS locked_video_url TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS unlock_code TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS unlock_hint TEXT;
