"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

const components: Components = {
  h2: ({ children, id, ...props }) => (
    <h2
      id={id}
      className="text-[1.4rem] font-semibold mt-16 mb-5 scroll-mt-24 text-light-text dark:text-dark-text tracking-tight leading-snug"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, id, ...props }) => (
    <h3
      id={id}
      className="text-[1.15rem] font-semibold mt-12 mb-4 scroll-mt-24 text-light-text dark:text-dark-text tracking-tight"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-6 text-[16.5px] leading-[1.85] text-light-text-secondary dark:text-dark-text-secondary" {...props}>
      {children}
    </p>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-[3px] border-light-accent/60 dark:border-dark-accent/60 pl-5 my-8 [&_p]:text-light-muted [&_p]:dark:text-dark-muted [&_p]:italic [&_p]:mb-2"
      {...props}
    >
      {children}
    </blockquote>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="bg-light-bg-soft dark:bg-dark-bg-soft px-5 py-4 rounded-lg overflow-x-auto my-8 text-[14px] font-mono leading-[1.7] border border-light-border/60 dark:border-dark-border/60"
      {...props}
    >
      {children}
    </pre>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="px-1.5 py-[2px] rounded-[4px] bg-light-accent-soft dark:bg-dark-accent-soft text-light-accent dark:text-dark-accent text-[0.9em] font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return <code className={`${className ?? ""} font-mono`} {...props}>{children}</code>;
  },
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-light-accent dark:text-dark-accent link-hover"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, ...props }) => (
    <span className="block my-10">
      <img src={src} alt={alt ?? ""} className="rounded-lg max-w-full mx-auto" loading="lazy" {...props} />
      {alt && <span className="block text-center text-[13px] text-light-muted dark:text-dark-muted mt-3">{alt}</span>}
    </span>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-8">
      <table className="min-w-full text-[15px]" {...props}>{children}</table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border-b-2 border-light-border dark:border-dark-border px-3 py-2.5 font-semibold text-left text-light-text dark:text-dark-text text-[14px]" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-b border-light-border/60 dark:border-dark-border/60 px-3 py-2.5 text-light-text-secondary dark:text-dark-text-secondary" {...props}>
      {children}
    </td>
  ),
  ul: ({ children, ...props }) => (
    <ul className="pl-5 mb-6 space-y-2 text-[16.5px] leading-[1.85] text-light-text-secondary dark:text-dark-text-secondary list-disc marker:text-light-accent/60 dark:marker:text-dark-accent/60" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="pl-5 mb-6 space-y-2 text-[16.5px] leading-[1.85] text-light-text-secondary dark:text-dark-text-secondary list-decimal marker:text-light-muted dark:marker:text-dark-muted" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-[1.85] pl-1" {...props}>{children}</li>
  ),
  hr: () => <hr className="my-12 border-light-border/60 dark:border-dark-border/60" />,
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-light-text dark:text-dark-text" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>{children}</em>
  ),
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article className="max-w-none animate-fade-up" data-reading-progress>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSlug]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
