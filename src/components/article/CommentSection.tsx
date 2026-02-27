"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ThumbsUp, MessageCircle, Trash2, Github, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchComments, createComment, toggleCommentLike, deleteComment } from "@/lib/comments";
import type { CommentData } from "@/lib/comments";

interface CommentSectionProps {
  postSlug: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "刚刚";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} 天前`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} 个月前`;
  return `${Math.floor(diffMonth / 12)} 年前`;
}

function CommentInput({
  onSubmit,
  placeholder = "写下你的想法...",
  autoFocus = false,
  onCancel,
}: {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-light-border dark:border-dark-border">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none p-0 text-light-text dark:text-dark-text placeholder:text-light-muted/50 min-h-[80px] resize-none text-sm"
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="评论内容"
      />
      <div className="flex justify-end items-center mt-3 pt-3 border-t border-light-border/50 dark:border-dark-border/50 gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-light-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
          >
            取消
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="px-5 py-1.5 bg-light-accent dark:bg-dark-accent text-white dark:text-black rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "发布中..." : "发布评论"}
        </button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  postSlug,
  userId,
  isAdmin,
  onRefresh,
}: {
  comment: CommentData;
  postSlug: string;
  userId?: string;
  isAdmin: boolean;
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [likes, setLikes] = useState(comment.likes);
  const [hasLiked, setHasLiked] = useState(comment.user_has_liked ?? false);
  const [showReplies, setShowReplies] = useState(true);

  const handleLike = async () => {
    if (!userId) return;
    setHasLiked(!hasLiked);
    setLikes((prev) => (hasLiked ? Math.max(0, prev - 1) : prev + 1));
    try {
      await toggleCommentLike(comment.id, userId, hasLiked);
    } catch {
      setHasLiked(hasLiked);
      setLikes(comment.likes);
    }
  };

  const handleReply = async (content: string) => {
    if (!user) return;
    await createComment(
      postSlug,
      user.id,
      user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "匿名",
      user.user_metadata?.avatar_url ?? null,
      content,
      comment.id
    );
    setShowReply(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除此评论吗？")) return;
    await deleteComment(comment.id);
    onRefresh();
  };

  const canDelete = userId === comment.user_id || isAdmin;

  return (
    <div className="group/comment">
      <div className="flex gap-3">
        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-light-bg-secondary dark:bg-dark-card flex-shrink-0">
          <Image
            src={comment.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_name}`}
            alt={comment.user_name}
            width={36}
            height={36}
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-light-text dark:text-dark-text">{comment.user_name}</span>
            <span className="text-xs text-light-muted dark:text-dark-muted">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-light-text dark:text-dark-text/90 leading-relaxed mb-2 whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="flex items-center gap-4 text-xs text-light-muted dark:text-dark-muted">
            <button
              type="button"
              onClick={handleLike}
              disabled={!userId}
              className={`flex items-center gap-1 transition-colors ${
                hasLiked ? "text-light-accent dark:text-dark-accent" : "hover:text-light-accent dark:hover:text-dark-accent"
              } disabled:opacity-50`}
            >
              <ThumbsUp width={13} height={13} />
              {likes > 0 && likes}
            </button>
            {userId && (
              <button
                type="button"
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1 hover:text-light-text dark:hover:text-dark-text transition-colors"
              >
                <MessageCircle width={13} height={13} />
                回复
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1 hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100"
              >
                <Trash2 width={13} height={13} />
              </button>
            )}
          </div>

          {showReply && (
            <div className="mt-3">
              <CommentInput onSubmit={handleReply} placeholder={`回复 ${comment.user_name}...`} autoFocus onCancel={() => setShowReply(false)} />
            </div>
          )}

          {(comment.replies?.length ?? 0) > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs text-light-accent dark:text-dark-accent hover:opacity-80 transition-opacity mb-2"
              >
                {showReplies ? <ChevronUp width={14} height={14} /> : <ChevronDown width={14} height={14} />}
                {comment.replies!.length} 条回复
              </button>
              {showReplies && (
                <div className="space-y-4 pl-3 border-l-2 border-light-border dark:border-dark-border">
                  {comment.replies!.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      postSlug={postSlug}
                      userId={userId}
                      isAdmin={isAdmin}
                      onRefresh={onRefresh}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentSection({ postSlug }: CommentSectionProps) {
  const { user, loading, isAdmin, signInWithGitHub, signInWithGoogle, signOut } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  const refresh = useCallback(async () => {
    setLoadingComments(true);
    const data = await fetchComments(postSlug, user?.id);
    setComments(data);
    setLoadingComments(false);
  }, [postSlug, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async (content: string) => {
    if (!user) return;
    await createComment(
      postSlug,
      user.id,
      user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "匿名",
      user.user_metadata?.avatar_url ?? null,
      content
    );
    refresh();
  };

  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);

  return (
    <section className="max-w-3xl mx-auto">
      <h3 className="font-serif text-2xl font-bold mb-8 text-light-text dark:text-dark-text flex items-center gap-3">
        评论
        <span className="text-base font-sans font-normal text-light-muted dark:text-dark-muted">
          ({totalComments})
        </span>
      </h3>

      {loading ? (
        <div className="text-center py-8 text-light-muted dark:text-dark-muted text-sm">加载中...</div>
      ) : user ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative w-7 h-7 rounded-full overflow-hidden bg-light-bg-secondary dark:bg-dark-card">
                <Image
                  src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt="avatar"
                  width={28}
                  height={28}
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span className="text-sm text-light-text dark:text-dark-text">
                {user.user_metadata?.full_name ?? user.email?.split("@")[0]}
              </span>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1 text-xs text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              <LogOut width={12} height={12} />
              退出
            </button>
          </div>
          <CommentInput onSubmit={handleSubmit} />
        </div>
      ) : (
        <div className="mb-8 p-6 bg-light-bg-secondary dark:bg-dark-card/50 rounded-2xl border border-light-border dark:border-dark-border text-center">
          <p className="text-sm text-light-muted dark:text-dark-muted mb-4">登录后即可发表评论</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={signInWithGitHub}
              className="flex items-center gap-2 px-4 py-2 bg-[#24292e] text-white rounded-full text-sm font-medium hover:bg-[#1a1e22] transition-colors"
            >
              <Github width={16} height={16} />
              GitHub 登录
            </button>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-bg text-light-text dark:text-dark-text border border-light-border dark:border-dark-border rounded-full text-sm font-medium hover:bg-light-bg-secondary dark:hover:bg-dark-card transition-colors"
            >
              <svg viewBox="0 0 24 24" width={16} height={16}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google 登录
            </button>
          </div>
        </div>
      )}

      {loadingComments ? (
        <div className="text-center py-8 text-light-muted dark:text-dark-muted text-sm">
          加载评论中...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-light-muted dark:text-dark-muted text-sm">
          暂无评论，来抢沙发吧！
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postSlug={postSlug}
              userId={user?.id}
              isAdmin={isAdmin}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </section>
  );
}
