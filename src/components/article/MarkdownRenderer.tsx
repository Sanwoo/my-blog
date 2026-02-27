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
    <h2 id={id} className="font-serif text-2xl font-bold mt-12 mb-4 scroll-mt-24" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, id, ...props }) => (
    <h3 id={id} className="font-serif text-xl font-semibold mt-8 mb-3 scroll-mt-24" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-4 leading-relaxed" {...props}>{children}</p>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-light-accent dark:border-dark-accent pl-4 my-6 italic text-light-muted dark:text-dark-muted"
      {...props}
    >
      {children}
    </blockquote>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="bg-light-bg-secondary dark:bg-dark-card p-4 rounded-xl border border-light-border dark:border-dark-border overflow-x-auto my-6 text-sm font-mono"
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
          className="px-1.5 py-0.5 rounded bg-light-bg-secondary dark:bg-dark-card text-light-accent dark:text-dark-accent text-sm font-mono"
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
      className="text-light-accent dark:text-dark-accent underline underline-offset-2 hover:opacity-80 transition-opacity"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, ...props }) => (
    <span className="block my-6">
      <img
        src={src}
        alt={alt ?? ""}
        className="rounded-xl max-w-full mx-auto"
        loading="lazy"
        {...props}
      />
      {alt && (
        <span className="block text-center text-sm text-light-muted dark:text-dark-muted mt-2">
          {alt}
        </span>
      )}
    </span>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border-collapse border border-light-border dark:border-dark-border" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border border-light-border dark:border-dark-border px-4 py-2 bg-light-bg-secondary dark:bg-dark-card font-semibold text-left" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-light-border dark:border-dark-border px-4 py-2" {...props}>
      {children}
    </td>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>{children}</ol>
  ),
  hr: () => (
    <hr className="my-8 border-light-border dark:border-dark-border" />
  ),
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article
      className="prose prose-lg dark:prose-invert max-w-none text-light-text dark:text-dark-text/90 leading-relaxed"
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
