-- ── Blog Posts ──
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  raw TEXT,
  note TEXT,
  layer INTEGER DEFAULT 1,
  size TEXT DEFAULT '0 KB',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Guestbook ──
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Message Board Threads ──
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  author TEXT NOT NULL,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Message Board Posts ──
CREATE TABLE IF NOT EXISTS message_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  email TEXT,
  body TEXT NOT NULL,
  is_sysop BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Reviews ──
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('movies', 'tv')),
  title TEXT NOT NULL,
  year INTEGER,
  rating INTEGER DEFAULT 0,
  status TEXT DEFAULT 'watched' CHECK (status IN ('watched', 'watchlist')),
  poster TEXT,
  review TEXT,
  analysis TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Restaurants ──
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  cuisine TEXT,
  status TEXT DEFAULT 'been' CHECK (status IN ('been', 'want')),
  rating INTEGER DEFAULT 0,
  icon TEXT,
  review TEXT,
  favorite TEXT,
  vibe TEXT,
  why TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Photos ──
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Contact Messages (ChemMail) ──
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── High Scores ──
CREATE TABLE IF NOT EXISTS high_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_name TEXT NOT NULL DEFAULT 'Anonymous',
  score INTEGER DEFAULT 0,
  type TEXT DEFAULT 'score',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Hidden Files (Layer 2+) ──
CREATE TABLE IF NOT EXISTS hidden_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  raw TEXT,
  layer INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Admin Users ──
CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO admin_users (email, role) VALUES ('chemworeric@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ── Row Level Security ──

-- Guestbook: anyone can read, anyone can insert
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guestbook_read" ON guestbook_entries FOR SELECT USING (true);
CREATE POLICY "guestbook_insert" ON guestbook_entries FOR INSERT WITH CHECK (true);

-- Message threads: anyone can read and insert
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads_read" ON message_threads FOR SELECT USING (true);
CREATE POLICY "threads_insert" ON message_threads FOR INSERT WITH CHECK (true);

-- Message posts: anyone can read and insert
ALTER TABLE message_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_read" ON message_posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON message_posts FOR INSERT WITH CHECK (true);

-- Blog: anyone can read published posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_read" ON blog_posts FOR SELECT USING (published = true);

-- Reviews: anyone can read
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_read" ON reviews FOR SELECT USING (true);

-- Restaurants: anyone can read
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurants_read" ON restaurants FOR SELECT USING (true);

-- Photos: anyone can read
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_read" ON photos FOR SELECT USING (true);

-- Contact messages: anyone can insert
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_insert" ON contact_messages FOR INSERT WITH CHECK (true);

-- High scores: anyone can read and insert
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores_read" ON high_scores FOR SELECT USING (true);
CREATE POLICY "scores_insert" ON high_scores FOR INSERT WITH CHECK (true);

-- Hidden files: only readable based on layer (default: authenticated)
ALTER TABLE hidden_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hidden_read" ON hidden_files FOR SELECT USING (true);

-- Admin users: no public access
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
