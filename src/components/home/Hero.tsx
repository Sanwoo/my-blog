import Image from "next/image";

export function Hero() {
  return (
    <header className="py-16 md:py-24 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16">
      <div className="flex-1 space-y-4 text-center md:text-left animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-medium text-light-text dark:text-dark-text leading-snug">
          Hi, I&apos;m <span className="font-bold">Echoes</span>{" "}
          <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-lg md:text-xl text-light-text dark:text-dark-text">
          A Design & Thinking{" "}
          <code className="px-2 py-0.5 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded text-light-accent dark:text-dark-accent font-mono text-base">
            &lt;Blog /&gt;
          </code>
        </p>
        <p className="text-light-muted dark:text-dark-muted text-sm leading-relaxed max-w-md">
          探索极简主义设计、前端技术与数字生活的交汇点。记录灵感，分享知识，保持思考。
        </p>
        <div className="flex items-center gap-3 pt-2 justify-center md:justify-start">
          {[
            { label: "GitHub", color: "bg-[#24292e] dark:bg-[#e8e8ea]", textColor: "text-white dark:text-[#24292e]" },
            { label: "Twitter", color: "bg-[#1da1f2]", textColor: "text-white" },
            { label: "RSS", color: "bg-[#ee802f]", textColor: "text-white" },
          ].map(({ label, color, textColor }) => (
            <a
              key={label}
              href="#"
              className={`w-8 h-8 rounded-full ${color} ${textColor} flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity`}
              title={label}
            >
              {label[0]}
            </a>
          ))}
        </div>
      </div>
      <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-light-bg-secondary dark:ring-dark-bg-secondary flex-shrink-0 animate-fade-in">
        <Image
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
          alt="avatar"
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    </header>
  );
}
