-- Add views counter and category to blog posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Allow public to update views (increment only via RPC)
CREATE OR REPLACE FUNCTION increment_blog_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts SET views = views + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
