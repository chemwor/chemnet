-- Add slides column to photos so a single entry can present
-- additional images as a slideshow (the primary `url` is slide 0).
ALTER TABLE photos ADD COLUMN IF NOT EXISTS slides TEXT[] DEFAULT '{}';
