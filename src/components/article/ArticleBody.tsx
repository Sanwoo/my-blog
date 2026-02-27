interface ArticleBodyProps {
  content?: string;
}

export function ArticleBody({ content }: ArticleBodyProps) {
  const html = content?.trim() ?? "";

  return (
    <article
      className="prose prose-lg dark:prose-invert max-w-none text-light-text-secondary dark:text-dark-text-secondary leading-[1.8] animate-fade-in [&_h2]:text-light-text [&_h2]:dark:text-dark-text [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-14 [&_h2]:mb-4 [&_h3]:text-light-text [&_h3]:dark:text-dark-text [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-10 [&_h3]:mb-3 [&_blockquote]:border-l-[3px] [&_blockquote]:border-light-accent [&_blockquote]:dark:border-dark-accent [&_blockquote]:text-light-muted [&_blockquote]:dark:text-dark-muted [&_pre]:bg-light-bg-secondary [&_pre]:dark:bg-dark-card [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-light-border [&_pre]:dark:border-dark-border [&_code]:text-light-accent [&_code]:dark:text-dark-accent"
      data-reading-progress
    >
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="text-light-muted dark:text-dark-muted">暂无正文。</p>
      )}
    </article>
  );
}
