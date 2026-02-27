import Image from "next/image";
import { ThumbsUp } from "lucide-react";
import type { Comment } from "@/data/placeholderComments";
import { placeholderComments } from "@/data/placeholderComments";

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-4">
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
        <Image
          src={comment.avatar}
          alt={comment.author}
          width={40}
          height={40}
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-light-text dark:text-dark-text">
              {comment.author}
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted">
              {comment.time}
            </span>
          </div>
        </div>
        <p className="text-sm text-light-text dark:text-dark-text/90 leading-relaxed mb-3">
          {comment.content}
        </p>
        <div className="flex items-center gap-4 text-xs text-light-muted dark:text-dark-muted">
          <button
            type="button"
            className="flex items-center gap-1 hover:text-light-accent dark:hover:text-dark-accent transition-colors"
          >
            <ThumbsUp width={14} height={14} aria-hidden />
            {comment.likes}
          </button>
          <button
            type="button"
            className="hover:text-light-text dark:hover:text-dark-text transition-colors"
          >
            回复
          </button>
        </div>
        {comment.replies?.map((reply, i) => (
          <div
            key={i}
            className="mt-4 ml-4 pl-4 border-l-2 border-light-border dark:border-dark-border flex gap-4"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              <Image
                src={reply.avatar}
                alt={reply.author}
                width={32}
                height={32}
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-light-text dark:text-dark-text">
                  {reply.author}
                </span>
                {reply.isAuthor && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-light-accent dark:bg-dark-accent text-white dark:text-black">
                    作者
                  </span>
                )}
              </div>
              <p className="text-sm text-light-text dark:text-dark-text/90 leading-relaxed">
                {reply.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommentList({ comments = placeholderComments }: { comments?: Comment[] }) {
  return (
    <div className="space-y-8">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
