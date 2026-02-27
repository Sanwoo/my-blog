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
    <h2 id={id} className="text-xl font-bold mt-14 mb-4 scroll-mt-20 text-light-text dark:text-dark-text" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, id, ...props }) => (
    <h3 id={id} className="text-lg font-semibold mt-10 mb-3 scroll-mt-20 text-light-text dark:text-dark-text" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-5 leading-[1.8] text-light-text-secondary dark:text-dark-text-secondary" {...props}>{children}</p>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-[3px] border-light-accent dark:border-dark-accent pl-4 my-6 text-light-muted dark:text-dark-muted italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="bg-light-bg-secondary dark:bg-dark-card p-4 rounded-lg overflow-x-auto my-6 text-sm font-mono leading-relaxed border border-light-border dark:border-dark-border"
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
          className="px-1.5 py-0.5 rounded bg-light-accent-soft dark:bg-dark-accent-soft text-light-accent dark:text-dark-accent text-[0.9em] font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={`${className ?? ""} font-mono text-sm`} {...props}>
        {children}
      </code>
    );
  },
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-light-accent dark:text-dark-accent underline underline-offset-2 decoration-light-accent/30 dark:decoration-dark-accent/30 hover:decoration-light-accent dark:hover:decoration-dark-accent transition-colors"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, ...props }) => (
    <span className="block my-8">
      <img
        src={src}
        alt={alt ?? ""}
        className="rounded-lg max-w-full mx-auto"
        loading="lazy"
        {...props}
      />
      {alt && (
        <span className="block text-center text-xs text-light-muted dark:text-dark-muted mt-2">
          {alt}
        </span>
      )}
    </span>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border-b-2 border-light-border dark:border-dark-border px-3 py-2 font-semibold text-left text-light-text dark:text-dark-text" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-b border-light-border dark:border-dark-border px-3 py-2 text-light-text-secondary dark:text-dark-text-secondary" {...props}>
      {children}
    </td>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-5 mb-5 space-y-1.5 text-light-text-secondary dark:text-dark-text-secondary marker:text-light-accent dark:marker:text-dark-accent" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal pl-5 mb-5 space-y-1.5 text-light-text-secondary dark:text-dark-text-secondary" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-[1.8]" {...props}>{children}</li>
  ),
  hr: () => (
    <hr className="my-10 border-light-border dark:border-dark-border" />
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-light-text dark:text-dark-text" {...props}>{children}</strong>
  ),
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article
      className="max-w-none animate-fade-in"
      data-reading-progress
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
