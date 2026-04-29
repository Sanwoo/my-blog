-- Echoes 2.0 schema
-- Run this in the Supabase SQL editor for a fresh database bootstrap.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published');
CREATE TYPE comment_status AS ENUM ('published', 'hidden');
CREATE TYPE profile_role AS ENUM ('author', 'reader');
CREATE TYPE reaction_kind AS ENUM ('appreciate');
CREATE TYPE interaction_notification_kind AS ENUM ('post_reaction', 'post_comment', 'comment_like', 'comment_reply');

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  handle text NOT NULL DEFAULT '@reader',
  avatar_url text,
  role profile_role NOT NULL DEFAULT 'reader',
  display_name_customized boolean NOT NULL DEFAULT false,
  avatar_customized boolean NOT NULL DEFAULT false,
  avatar_storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content_json jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb,
  content_html text NOT NULL DEFAULT '',
  category_id uuid NOT NULL REFERENCES post_categories (id),
  status post_status NOT NULL DEFAULT 'draft',
  seo_description text NOT NULL DEFAULT '',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  read_time_minutes integer NOT NULL DEFAULT 1,
  comment_count integer NOT NULL DEFAULT 0,
  reaction_count integer NOT NULL DEFAULT 0,
  author_id uuid REFERENCES profiles (id) ON DELETE SET NULL
);

CREATE TABLE post_tag_assignments (
  post_id uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES post_tags (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE post_working_copies (
  post_id uuid PRIMARY KEY REFERENCES posts (id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content_json jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb,
  content_html text NOT NULL DEFAULT '',
  category_id uuid NOT NULL REFERENCES post_categories (id),
  status post_status NOT NULL DEFAULT 'published',
  seo_description text NOT NULL DEFAULT '',
  published_at timestamptz,
  read_time_minutes integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_working_copy_tag_assignments (
  post_id uuid NOT NULL REFERENCES post_working_copies (post_id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES post_tags (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  parent_id uuid,
  body text NOT NULL,
  status comment_status NOT NULL DEFAULT 'published',
  like_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id),
  UNIQUE (id, post_id),
  FOREIGN KEY (parent_id, post_id) REFERENCES comments (id, post_id) ON DELETE CASCADE
);

CREATE TABLE comment_likes (
  comment_id uuid NOT NULL REFERENCES comments (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE post_reactions (
  post_id uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  kind reaction_kind NOT NULL DEFAULT 'appreciate',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, kind)
);

CREATE TABLE interaction_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind interaction_notification_kind NOT NULL,
  recipient_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  comment_id uuid REFERENCES comments (id) ON DELETE CASCADE,
  reply_id uuid REFERENCES comments (id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  body_snippet text NOT NULL DEFAULT '',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_status_published_at ON posts (status, published_at DESC);
CREATE INDEX idx_posts_category ON posts (category_id);
CREATE INDEX idx_posts_author_updated ON posts (author_id, updated_at DESC);
CREATE INDEX idx_posts_public_published
  ON posts (published_at DESC)
  WHERE status IN ('published', 'scheduled') AND published_at IS NOT NULL;
CREATE INDEX idx_posts_public_category_published
  ON posts (category_id, published_at DESC)
  WHERE status IN ('published', 'scheduled') AND published_at IS NOT NULL;
CREATE INDEX idx_post_categories_archived ON post_categories (archived_at, name);
CREATE INDEX idx_post_tags_archived ON post_tags (archived_at, name);
CREATE INDEX idx_post_tag_assignments_tag ON post_tag_assignments (tag_id);
CREATE INDEX idx_post_working_copy_tag_assignments_tag ON post_working_copy_tag_assignments (tag_id);
CREATE INDEX idx_comments_post_status_created ON comments (post_id, status, created_at);
CREATE INDEX idx_comments_parent ON comments (parent_id);
CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_interaction_notifications_recipient_created
  ON interaction_notifications (recipient_id, created_at DESC);
CREATE INDEX idx_interaction_notifications_recipient_read
  ON interaction_notifications (recipient_id, read_at, created_at DESC);
CREATE INDEX idx_interaction_notifications_recipient_unread_kind
  ON interaction_notifications (recipient_id, kind, created_at DESC)
  WHERE read_at IS NULL;
CREATE UNIQUE INDEX idx_interaction_notifications_reply_unique
  ON interaction_notifications (reply_id)
  WHERE kind = 'comment_reply';
CREATE UNIQUE INDEX idx_interaction_notifications_post_comment_unique
  ON interaction_notifications (comment_id)
  WHERE kind = 'post_comment';
CREATE UNIQUE INDEX idx_interaction_notifications_comment_like_unique
  ON interaction_notifications (comment_id, actor_id)
  WHERE kind = 'comment_like';
CREATE UNIQUE INDEX idx_interaction_notifications_post_reaction_unique
  ON interaction_notifications (post_id, actor_id)
  WHERE kind = 'post_reaction';

CREATE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE FUNCTION update_post_updated_at()
RETURNS trigger AS $$
BEGIN
  IF (
    to_jsonb(NEW) - '{updated_at,author_id,comment_count,reaction_count}'::text[]
  ) IS DISTINCT FROM (
    to_jsonb(OLD) - '{updated_at,author_id,comment_count,reaction_count}'::text[]
  ) THEN
    NEW.updated_at = now();
  ELSE
    NEW.updated_at = OLD.updated_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE FUNCTION is_author()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'author'
  );
$$ LANGUAGE sql STABLE
SET search_path = public;

CREATE FUNCTION refresh_post_metrics(target_post_id uuid)
RETURNS void AS $$
  UPDATE posts
  SET
    comment_count = (
      SELECT COUNT(*)
      FROM comments
      WHERE post_id = target_post_id AND status = 'published'
    ),
    reaction_count = (
      SELECT COUNT(*)
      FROM post_reactions
      WHERE post_id = target_post_id
    )
  WHERE id = target_post_id;
$$ LANGUAGE sql
SET search_path = public;

CREATE FUNCTION sync_post_metrics()
RETURNS trigger AS $$
DECLARE
  target_post_id uuid;
BEGIN
  target_post_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.post_id ELSE NEW.post_id END;
  PERFORM refresh_post_metrics(target_post_id);

  IF TG_OP = 'UPDATE' AND OLD.post_id IS DISTINCT FROM NEW.post_id THEN
    PERFORM refresh_post_metrics(OLD.post_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE FUNCTION sync_comment_like_count()
RETURNS trigger AS $$
DECLARE
  target_comment_id uuid;
BEGIN
  target_comment_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.comment_id ELSE NEW.comment_id END;

  UPDATE comments
  SET like_count = (
    SELECT COUNT(*)::integer
    FROM comment_likes
    WHERE comment_likes.comment_id = target_comment_id
  )
  WHERE comments.id = target_comment_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE FUNCTION get_unread_interaction_summary(
  p_recipient_id uuid
)
RETURNS TABLE (
  total integer,
  likes integer,
  replies integer
) AS $$
  SELECT
    COUNT(*)::integer AS total,
    COUNT(*) FILTER (WHERE kind IN ('post_reaction', 'comment_like'))::integer AS likes,
    COUNT(*) FILTER (WHERE kind IN ('post_comment', 'comment_reply'))::integer AS replies
  FROM interaction_notifications
  WHERE recipient_id = p_recipient_id
    AND read_at IS NULL;
$$ LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public;

CREATE FUNCTION create_comment_with_interaction_notification(
  p_post_id uuid,
  p_actor_id uuid,
  p_parent_id uuid,
  p_body text
)
RETURNS TABLE (
  id uuid,
  author_id uuid,
  parent_id uuid,
  body text,
  created_at timestamptz,
  like_count integer
) AS $$
DECLARE
  inserted_comment comments%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM posts
    WHERE posts.id = p_post_id
      AND posts.status IN ('published', 'scheduled')
      AND posts.published_at IS NOT NULL
      AND posts.published_at <= now()
  ) THEN
    RAISE EXCEPTION 'POST_NOT_FOUND';
  END IF;

  IF p_parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM comments
    WHERE comments.id = p_parent_id
      AND comments.post_id = p_post_id
      AND comments.status = 'published'
  ) THEN
    RAISE EXCEPTION 'INVALID_PARENT';
  END IF;

  INSERT INTO comments (
    post_id,
    author_id,
    parent_id,
    body,
    status
  )
  VALUES (
    p_post_id,
    p_actor_id,
    p_parent_id,
    p_body,
    'published'
  )
  RETURNING * INTO inserted_comment;

  IF inserted_comment.parent_id IS NULL THEN
    INSERT INTO interaction_notifications (
      kind,
      recipient_id,
      actor_id,
      comment_id,
      post_id,
      body_snippet,
      created_at
    )
    SELECT
      'post_comment',
      posts.author_id,
      inserted_comment.author_id,
      inserted_comment.id,
      inserted_comment.post_id,
      left(inserted_comment.body, 220),
      inserted_comment.created_at
    FROM posts
    WHERE posts.id = inserted_comment.post_id
      AND posts.author_id IS NOT NULL
      AND posts.author_id <> inserted_comment.author_id
    ON CONFLICT DO NOTHING;

    RETURN QUERY SELECT
      inserted_comment.id,
      inserted_comment.author_id,
      inserted_comment.parent_id,
      inserted_comment.body,
      inserted_comment.created_at,
      inserted_comment.like_count;

    RETURN;
  END IF;

  INSERT INTO interaction_notifications (
    kind,
    recipient_id,
    actor_id,
    comment_id,
    reply_id,
    post_id,
    body_snippet,
    created_at
  )
  SELECT
    'comment_reply',
    comments.author_id,
    inserted_comment.author_id,
    inserted_comment.parent_id,
    inserted_comment.id,
    inserted_comment.post_id,
    left(inserted_comment.body, 220),
    inserted_comment.created_at
  FROM comments
  WHERE comments.id = inserted_comment.parent_id
    AND comments.author_id <> inserted_comment.author_id
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT
    inserted_comment.id,
    inserted_comment.author_id,
    inserted_comment.parent_id,
    inserted_comment.body,
    inserted_comment.created_at,
    inserted_comment.like_count;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE FUNCTION toggle_comment_like_with_interaction_notification(
  p_comment_id uuid,
  p_actor_id uuid
)
RETURNS TABLE (
  liked boolean,
  post_slug text
) AS $$
DECLARE
  target_comment record;
  affected_count integer;
BEGIN
  SELECT
    comments.id,
    comments.author_id,
    comments.post_id,
    comments.body,
    posts.slug
  INTO target_comment
  FROM comments
  JOIN posts ON posts.id = comments.post_id
  WHERE comments.id = p_comment_id
    AND comments.status = 'published'
    AND posts.status IN ('published', 'scheduled')
    AND posts.published_at IS NOT NULL
    AND posts.published_at <= now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'COMMENT_NOT_FOUND';
  END IF;

  DELETE FROM comment_likes
  WHERE comment_likes.comment_id = p_comment_id
    AND comment_likes.user_id = p_actor_id;
  GET DIAGNOSTICS affected_count = ROW_COUNT;

  IF affected_count > 0 THEN
    DELETE FROM interaction_notifications
    WHERE interaction_notifications.kind = 'comment_like'
      AND interaction_notifications.comment_id = p_comment_id
      AND interaction_notifications.actor_id = p_actor_id;

    RETURN QUERY SELECT false, target_comment.slug::text;
    RETURN;
  END IF;

  INSERT INTO comment_likes (
    comment_id,
    user_id
  )
  VALUES (
    p_comment_id,
    p_actor_id
  )
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS affected_count = ROW_COUNT;

  IF affected_count > 0 THEN
    INSERT INTO interaction_notifications (
      kind,
      recipient_id,
      actor_id,
      comment_id,
      post_id,
      body_snippet,
      created_at
    )
    SELECT
      'comment_like',
      target_comment.author_id,
      p_actor_id,
      p_comment_id,
      target_comment.post_id,
      left(target_comment.body, 220),
      now()
    WHERE target_comment.author_id <> p_actor_id
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY SELECT true, target_comment.slug::text;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE FUNCTION toggle_post_reaction_with_interaction_notification(
  p_slug text,
  p_actor_id uuid
)
RETURNS TABLE (
  reacted boolean,
  post_id uuid,
  reaction_count integer
) AS $$
DECLARE
  target_post record;
  affected_count integer;
BEGIN
  SELECT
    posts.id,
    posts.author_id,
    posts.title
  INTO target_post
  FROM posts
  WHERE posts.slug = p_slug
    AND posts.status IN ('published', 'scheduled')
    AND posts.published_at IS NOT NULL
    AND posts.published_at <= now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'POST_NOT_FOUND';
  END IF;

  DELETE FROM post_reactions
  WHERE post_reactions.post_id = target_post.id
    AND post_reactions.user_id = p_actor_id
    AND post_reactions.kind = 'appreciate';
  GET DIAGNOSTICS affected_count = ROW_COUNT;

  IF affected_count > 0 THEN
    DELETE FROM interaction_notifications
    WHERE interaction_notifications.kind = 'post_reaction'
      AND interaction_notifications.post_id = target_post.id
      AND interaction_notifications.actor_id = p_actor_id;

    RETURN QUERY SELECT
      false,
      target_post.id,
      COALESCE((
        SELECT posts.reaction_count
        FROM posts
        WHERE posts.id = target_post.id
      ), 0);
    RETURN;
  END IF;

  INSERT INTO post_reactions (
    post_id,
    user_id,
    kind
  )
  VALUES (
    target_post.id,
    p_actor_id,
    'appreciate'
  )
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS affected_count = ROW_COUNT;

  IF affected_count > 0 THEN
    INSERT INTO interaction_notifications (
      kind,
      recipient_id,
      actor_id,
      post_id,
      body_snippet,
      created_at
    )
    SELECT
      'post_reaction',
      target_post.author_id,
      p_actor_id,
      target_post.id,
      left(target_post.title, 220),
      now()
    WHERE target_post.author_id IS NOT NULL
      AND target_post.author_id <> p_actor_id
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY SELECT
    true,
    target_post.id,
    COALESCE((
      SELECT posts.reaction_count
      FROM posts
      WHERE posts.id = target_post.id
    ), 0);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

REVOKE ALL ON FUNCTION create_comment_with_interaction_notification(uuid, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_comment_with_interaction_notification(uuid, uuid, uuid, text) TO service_role;

REVOKE ALL ON FUNCTION toggle_comment_like_with_interaction_notification(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_comment_like_with_interaction_notification(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION toggle_post_reaction_with_interaction_notification(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_post_reaction_with_interaction_notification(text, uuid) TO service_role;

REVOKE ALL ON FUNCTION get_unread_interaction_summary(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_unread_interaction_summary(uuid) TO service_role;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_updated_at();

CREATE TRIGGER post_categories_updated_at
  BEFORE UPDATE ON post_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER post_tags_updated_at
  BEFORE UPDATE ON post_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER post_working_copies_updated_at
  BEFORE UPDATE ON post_working_copies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_metrics_sync
  AFTER INSERT OR UPDATE OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION sync_post_metrics();

CREATE TRIGGER reactions_metrics_sync
  AFTER INSERT OR UPDATE OR DELETE ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_post_metrics();

CREATE TRIGGER comment_likes_count_sync
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION sync_comment_like_count();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_working_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_working_copy_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_read_all
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY profiles_update_self
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_insert_self
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY post_categories_read_all
  ON post_categories FOR SELECT
  USING (true);

CREATE POLICY post_categories_manage_author
  ON post_categories FOR ALL
  USING (is_author())
  WITH CHECK (is_author());

CREATE POLICY post_tags_read_all
  ON post_tags FOR SELECT
  USING (true);

CREATE POLICY post_tags_manage_author
  ON post_tags FOR ALL
  USING (is_author())
  WITH CHECK (is_author());

CREATE POLICY posts_read_public
  ON posts FOR SELECT
  USING (
    status IN ('published', 'scheduled')
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

CREATE POLICY posts_manage_author
  ON posts FOR ALL
  USING (is_author() AND author_id = auth.uid())
  WITH CHECK (is_author() AND author_id = auth.uid());

CREATE POLICY post_tag_assignments_read_all
  ON post_tag_assignments FOR SELECT
  USING (true);

CREATE POLICY post_tag_assignments_manage_author
  ON post_tag_assignments FOR ALL
  USING (
    is_author()
    AND EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_tag_assignments.post_id AND posts.author_id = auth.uid()
    )
  )
  WITH CHECK (
    is_author()
    AND EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_tag_assignments.post_id AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY post_working_copies_manage_author
  ON post_working_copies FOR ALL
  USING (
    is_author()
    AND EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_working_copies.post_id AND posts.author_id = auth.uid()
    )
  )
  WITH CHECK (
    is_author()
    AND EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_working_copies.post_id AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY post_working_copy_tag_assignments_manage_author
  ON post_working_copy_tag_assignments FOR ALL
  USING (
    is_author()
    AND EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_working_copy_tag_assignments.post_id AND posts.author_id = auth.uid()
    )
  )
  WITH CHECK (
    is_author()
    AND EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_working_copy_tag_assignments.post_id AND posts.author_id = auth.uid()
    )
  );

CREATE POLICY comments_read_published
  ON comments FOR SELECT
  USING (status = 'published');

CREATE POLICY comments_update_own
  ON comments FOR UPDATE
  USING (auth.uid() = author_id OR is_author())
  WITH CHECK (auth.uid() = author_id OR is_author());

CREATE POLICY comment_likes_read_all
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY post_reactions_read_all
  ON post_reactions FOR SELECT
  USING (true);

CREATE POLICY interaction_notifications_read_recipient
  ON interaction_notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY interaction_notifications_update_recipient
  ON interaction_notifications FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('post-images', 'post-images', true);

CREATE POLICY avatars_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY post_images_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE FUNCTION publish_due_scheduled_posts()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE posts
  SET status = 'published'
  WHERE status = 'scheduled'
    AND published_at IS NOT NULL
    AND published_at <= now();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

SELECT cron.schedule(
  'publish-due-scheduled-posts',
  '* * * * *',
  $cron$SELECT public.publish_due_scheduled_posts();$cron$
);
