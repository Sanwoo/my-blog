-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug text NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_avatar text,
  content text NOT NULL,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  likes integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments (post_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments (parent_id);

-- Online presence table
CREATE TABLE IF NOT EXISTS online_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  page_path text NOT NULL DEFAULT '/',
  post_slug text,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presence_page ON online_presence (page_path);
CREATE INDEX IF NOT EXISTS idx_presence_post ON online_presence (post_slug);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON online_presence (last_seen_at);

-- Comment likes (prevent double-likes)
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Anyone can read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comment_likes
CREATE POLICY "Anyone can read likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for online_presence (public)
CREATE POLICY "Anyone can read presence" ON online_presence FOR SELECT USING (true);
CREATE POLICY "Anyone can insert presence" ON online_presence FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own presence" ON online_presence FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete own presence" ON online_presence FOR DELETE USING (true);

-- Enable Realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE online_presence;

-- Update posts table to store markdown content
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_format text DEFAULT 'markdown';

-- Function to clean up stale presence records (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM online_presence WHERE last_seen_at < now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at for comments
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_updated_at ON comments;
CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE PROCEDURE update_comment_updated_at();
