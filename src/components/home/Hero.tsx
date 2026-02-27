export function Hero() {
  return (
    <header className="py-12 md:py-20 text-center md:text-left border-b border-light-border dark:border-dark-border mb-12">
      <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-light-text dark:text-dark-text mb-6 leading-tight">
        Design <span className="text-light-muted dark:text-dark-muted italic">&</span>
        <br />
        Thinking.
      </h1>
      <p className="text-lg md:text-xl text-light-muted dark:text-dark-muted max-w-2xl leading-relaxed">
        探索极简主义设计、前端技术与数字生活的交汇点。
        <br className="hidden md:block" />
        记录灵感，分享知识，保持思考。
      </p>
    </header>
  );
}
