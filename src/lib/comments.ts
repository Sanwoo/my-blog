import { getSupabaseBrowser } from "@/lib/supabase-browser";

export interface CommentData {
  id: string;
  post_slug: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  parent_id: string | null;
  likes: number;
  created_at: string;
  updated_at: string;
  replies?: CommentData[];
  user_has_liked?: boolean;
}

export async function fetchComments(postSlug: string, currentUserId?: string): Promise<CommentData[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_slug", postSlug)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  let userLikes = new Set<string>();
  if (currentUserId) {
    const { data: likesData } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", currentUserId);
    userLikes = new Set((likesData ?? []).map((l) => l.comment_id));
  }

  const comments = data.map((c) => ({
    ...c,
    user_has_liked: userLikes.has(c.id),
    replies: [] as CommentData[],
  }));

  const topLevel: CommentData[] = [];
  const childMap = new Map<string, CommentData[]>();

  for (const c of comments) {
    if (c.parent_id) {
      const existing = childMap.get(c.parent_id) ?? [];
      existing.push(c);
      childMap.set(c.parent_id, existing);
    } else {
      topLevel.push(c);
    }
  }

  for (const c of topLevel) {
    c.replies = childMap.get(c.id) ?? [];
  }

  return topLevel;
}

export async function createComment(
  postSlug: string,
  userId: string,
  userName: string,
  userAvatar: string | null,
  content: string,
  parentId?: string
) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_slug: postSlug,
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar,
      content,
      parent_id: parentId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleCommentLike(commentId: string, userId: string, hasLiked: boolean) {
  const supabase = getSupabaseBrowser();

  if (hasLiked) {
    await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
    await supabase.from("comments").update({ likes: Math.max(0) }).eq("id", commentId);
  } else {
    await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
  }

  const { count } = await supabase
    .from("comment_likes")
    .select("*", { count: "exact", head: true })
    .eq("comment_id", commentId);
  const newLikes = count ?? 0;
  await supabase.from("comments").update({ likes: newLikes }).eq("id", commentId);
  return newLikes;
}

export async function deleteComment(commentId: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}
