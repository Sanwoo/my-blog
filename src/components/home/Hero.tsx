import Image from "next/image";
import { ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <header className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-center">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-20 animate-fade-up py-16 md:py-0">
        <div className="flex-1 space-y-5 text-center md:text-left">
          <h1 className="text-[2.5rem] md:text-[2.8rem] leading-snug tracking-tight">
            <span className="text-light-text-secondary dark:text-dark-text-secondary font-light">Hi, I&apos;m </span>
            <span className="font-semibold text-light-text dark:text-dark-text">Echoes</span>
            {" "}
            <span className="inline-block">👋</span>
            <span className="text-light-muted dark:text-dark-muted">。</span>
          </h1>
          <p className="text-xl md:text-[1.35rem] text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
            A Design &amp; Thinking{" "}
            <code className="inline-block px-2.5 py-0.5 bg-light-accent-soft dark:bg-dark-accent-soft text-light-accent dark:text-dark-accent rounded font-mono text-[0.9em] tracking-wide">
              &lt;Blog /&gt;
            </code>
          </p>
          <p className="text-[15px] text-light-muted dark:text-dark-muted leading-[1.8] max-w-lg">
            探索极简主义设计、前端技术与数字生活的交汇点。
            <br className="hidden md:block" />
            记录灵感，分享知识，保持思考。
          </p>
          <div className="flex items-center gap-3 pt-3 justify-center md:justify-start">
            {[
              { label: "GitHub", bg: "#24292e" },
              { label: "Twitter", bg: "#1da1f2" },
              { label: "邮件", bg: "#888888" },
              { label: "RSS", bg: "#ee802f" },
            ].map(({ label, bg }) => (
              <a
                key={label}
                href="#"
                className="social-icon group relative w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ background: bg }}
                title={label}
              >
                {label[0]}
                {/* Tooltip */}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-light-text dark:bg-dark-text text-light-bg dark:text-dark-bg text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>
        <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden flex-shrink-0 ring-[6px] ring-light-bg-soft dark:ring-dark-bg-soft shadow-soft">
          <Image src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" fill className="object-cover" unoptimized />
        </div>
      </div>

      {/* Scroll indicator — centered at bottom with gentle bounce */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: "600ms" }}>
        <p className="text-[12px] text-light-muted dark:text-dark-muted italic tracking-wide">Stay hungry, Stay foolish.</p>
        <ChevronDown width={20} height={20} className="text-light-muted dark:text-dark-muted animate-bounce-gentle" />
      </div>
    </header>
  );
}
