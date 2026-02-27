import Image from "next/image";

export function Hero() {
  return (
    <header className="pt-20 pb-24 md:pt-28 md:pb-32 flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-20 animate-fade-up">
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
            <a key={label} href="#" className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold transition-transform duration-200 hover:scale-110" style={{ background: bg }} title={label}>
              {label[0]}
            </a>
          ))}
        </div>
      </div>
      <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden flex-shrink-0 ring-[6px] ring-light-bg-soft dark:ring-dark-bg-soft shadow-soft">
        <Image src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" fill className="object-cover" unoptimized />
      </div>
    </header>
  );
}
