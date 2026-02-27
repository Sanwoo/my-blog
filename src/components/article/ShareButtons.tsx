"use client";

import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
}

const shareTargets = [
  {
    name: "Twitter / X",
    icon: () => (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "微博",
    icon: () => (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
        <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.583.631.275.825.985.442 1.574zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.194.573zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.642 4.318-.341 5.132-2.145.8-1.758-.145-3.681-2.161-4.183z" />
        <path d="M17.737 12.776c-.149-.047-.252-.078-.174-.282.172-.44.189-.818.003-1.088-.346-.502-1.293-.476-2.386-.014 0 0-.342.149-.254-.122.169-.555.143-.99-.117-1.301-.592-.708-2.168-.134-3.52.784-.998.68-1.559 1.38-1.559 1.38-.513.659-.935 1.38-1.278 2.095-1.047 2.193-.11 3.912 1.892 4.571 2.086.686 4.516-.236 5.43-2.009.332-.645.316-1.255-.037-2.014z" />
        <path d="M18.684 10.932c-.214-.065-.357-.109-.249-.395.237-.601.261-1.115.004-1.481-.477-.68-1.784-.643-3.28-.017 0 0-.473.202-.349-.168.234-.757.198-1.359-.161-1.784-.812-.961-2.968-.178-4.814 1.074-1.368.93-2.14 1.89-2.14 1.89" />
        <path d="M20.452 1.966c-.98-.982-2.371-1.217-3.107-.526-.735.691-.545 2.07.434 3.053.979.982 2.37 1.218 3.106.527.736-.691.545-2.072-.433-3.054z" />
        <path d="M16.673 4.008c-.391-.325-.932-.349-1.209-.054-.277.295-.2.801.189 1.126.391.325.932.35 1.209.054.277-.295.201-.801-.189-1.126z" />
      </svg>
    ),
    getUrl: (url: string, title: string) =>
      `https://service.weibo.com/share/share.php?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "LinkedIn",
    icon: () => (
      <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    getUrl: (url: string, title: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
];

export function ShareButtons({ title, url, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  };

  const handleShare = (getUrl: (url: string, title: string) => string) => {
    window.open(getUrl(url, title), "_blank", "width=600,height=500,noopener,noreferrer");
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-light-muted dark:text-dark-muted mr-1">
        <Share2 width={14} height={14} className="inline mr-1" />
        分享
      </span>
      {shareTargets.map((target) => (
        <button
          key={target.name}
          type="button"
          onClick={() => handleShare(target.getUrl)}
          className="p-2 rounded-full text-light-muted dark:text-dark-muted hover:text-light-accent dark:hover:text-dark-accent hover:bg-light-bg-secondary dark:hover:bg-dark-card transition-all"
          aria-label={`分享到 ${target.name}`}
          title={target.name}
        >
          <target.icon />
        </button>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        className="p-2 rounded-full text-light-muted dark:text-dark-muted hover:text-light-accent dark:hover:text-dark-accent hover:bg-light-bg-secondary dark:hover:bg-dark-card transition-all"
        aria-label="复制链接"
        title="复制链接"
      >
        {copied ? <Check width={16} height={16} /> : <Link2 width={16} height={16} />}
      </button>
    </div>
  );
}
