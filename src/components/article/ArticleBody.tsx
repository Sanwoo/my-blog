interface ArticleBodyProps {
  content?: string;
}

export function ArticleBody({ content }: ArticleBodyProps) {
  const html = content?.trim() ?? "";

  return (
    <article
      className="prose prose-lg dark:prose-invert max-w-none text-light-text dark:text-dark-text/90 leading-relaxed"
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
