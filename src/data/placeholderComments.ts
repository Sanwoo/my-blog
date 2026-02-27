export interface CommentReply {
  author: string;
  authorHandle?: string;
  isAuthor?: boolean;
  avatar: string;
  content: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  time: string;
  content: string;
  likes: number;
  replies?: CommentReply[];
}

export const placeholderComments: Comment[] = [
  {
    id: "1",
    author: "Sarah Jenkins",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    time: "2小时前",
    content:
      '非常有启发性的文章！特别是关于"还原物理质感"的部分，确实现在的设计虽然扁平，但通过光影营造的深度感才是高级感的来源。',
    likes: 24,
    replies: [
      {
        author: "Alex.Design",
        isAuthor: true,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        content:
          "谢谢 Sarah！是的，Context of Depth 是 Apple Design Guidelines 里非常核心的概念。",
      },
    ],
  },
];
