-- Daily Digest / Newsletter entries
CREATE TABLE IF NOT EXISTS digest_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  video_url TEXT,
  note TEXT,
  source TEXT,
  published_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Anyone can read, admin can write
ALTER TABLE digest_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "digest_read" ON digest_entries FOR SELECT USING (true);
CREATE POLICY "digest_admin_insert" ON digest_entries FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "digest_admin_update" ON digest_entries FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));
CREATE POLICY "digest_admin_delete" ON digest_entries FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));
