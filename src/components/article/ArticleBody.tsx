export function ArticleBody({ content }: { content: string }) {
  return (
    <article
      className="article-prose max-w-none font-serif text-[1.02rem] sm:text-[1.045rem]"
      data-reading-progress
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
