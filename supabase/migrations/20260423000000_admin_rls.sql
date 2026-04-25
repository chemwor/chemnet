-- Admin write policies for all content tables
-- Admin = authenticated user whose email is in admin_users table

-- Blog posts: admin can insert, update, delete
CREATE POLICY "blog_admin_insert" ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "blog_admin_update" ON blog_posts FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "blog_admin_delete" ON blog_posts FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

-- Also allow admin to SELECT all posts (including unpublished)
CREATE POLICY "blog_admin_read_all" ON blog_posts FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

-- Reviews: admin can insert, update, delete
CREATE POLICY "reviews_admin_insert" ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "reviews_admin_update" ON reviews FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "reviews_admin_delete" ON reviews FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

-- Restaurants: admin can insert, update, delete
CREATE POLICY "restaurants_admin_insert" ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "restaurants_admin_update" ON restaurants FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "restaurants_admin_delete" ON restaurants FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

-- Hidden files: admin can insert, update, delete
CREATE POLICY "hidden_admin_insert" ON hidden_files FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "hidden_admin_update" ON hidden_files FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "hidden_admin_delete" ON hidden_files FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

-- Photos: admin can insert, update, delete
CREATE POLICY "photos_admin_insert" ON photos FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "photos_admin_update" ON photos FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "photos_admin_delete" ON photos FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

-- Contact messages: admin can read and update (mark read)
CREATE POLICY "contact_admin_read" ON contact_messages FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "contact_admin_update" ON contact_messages FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

-- Admin users: admin can read own table
CREATE POLICY "admin_users_read" ON admin_users FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- High scores: admin can delete
CREATE POLICY "scores_admin_delete" ON high_scores FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email'));

-- Storage: allow admin uploads to all buckets
-- (This needs to be done in Supabase dashboard under Storage > Policies)

