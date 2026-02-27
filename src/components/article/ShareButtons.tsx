"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
}

const shareTargets = [
  {
    name: "Twitter",
    icon: () => (
      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "微博",
    icon: () => <span className="text-xs font-bold">微</span>,
    getUrl: (url: string, title: string) =>
      `https://service.weibo.com/share/share.php?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
];

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  };

  return (
    <div className="flex items-center gap-1">
      {shareTargets.map((target) => (
        <button
          key={target.name}
          type="button"
          onClick={() => window.open(target.getUrl(url, title), "_blank", "width=600,height=500,noopener,noreferrer")}
          className="p-1.5 rounded-md text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-all"
          aria-label={`分享到 ${target.name}`}
          title={target.name}
        >
          <target.icon />
        </button>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        className="p-1.5 rounded-md text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-all"
        aria-label="复制链接"
        title="复制链接"
      >
        {copied ? <Check width={14} height={14} className="text-green-500" /> : <Link2 width={14} height={14} />}
      </button>
    </div>
  );
}
