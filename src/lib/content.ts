import type { JSONContent } from "@tiptap/core";
import { SITE_TIME_ZONE } from "@/lib/site";
import type { TocItem } from "@/lib/types";

const HEADING_LEVELS = new Set([2, 3]);
const PUBLICLY_VISIBLE_POST_STATUS_SET = new Set(["published", "scheduled"]);
const SITE_MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TIME_ZONE,
  month: "numeric",
});
const SITE_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TIME_ZONE,
  year: "numeric",
});
const SITE_DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  timeZone: SITE_TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
});
const SITE_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  timeZone: SITE_TIME_ZONE,
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const PUBLICLY_VISIBLE_POST_STATUSES = ["published", "scheduled"] as const;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function textFromHtml(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function safeHref(href: string) {
  const trimmed = href.trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("mailto:")) {
    return trimmed;
  }
  return "#";
}

function safeImageSrc(src: string) {
  const trimmed = src.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return "";
}

export function slugify(value: string, fallback = "entry") {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || fallback;
}

function textFromNode(node: JSONContent | undefined | null): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map((child) => textFromNode(child)).join("");
}

function renderMarks(text: string, marks: JSONContent["marks"]) {
  return (marks ?? []).reduce((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return `<strong>${acc}</strong>`;
      case "italic":
        return `<em>${acc}</em>`;
      case "strike":
        return `<s>${acc}</s>`;
      case "code":
        return `<code>${acc}</code>`;
      case "link":
        return `<a href="${escapeHtml(safeHref(String(mark.attrs?.href ?? "#")))}" target="_blank" rel="noreferrer">${acc}</a>`;
      default:
        return acc;
    }
  }, text);
}

export function renderDocument(content: JSONContent | null | undefined) {
  const toc: TocItem[] = [];
  const headingRegistry = new Map<string, number>();

  function uniqueHeadingId(label: string) {
    const base = slugify(label, "section");
    const seen = headingRegistry.get(base) ?? 0;
    headingRegistry.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  }

  function renderChildren(children: JSONContent[] | undefined) {
    return (children ?? []).map((child) => renderNode(child)).join("");
  }

  function renderNode(node: JSONContent | undefined | null): string {
    if (!node) return "";

    switch (node.type) {
      case "doc":
        return renderChildren(node.content);
      case "paragraph": {
        const html = renderChildren(node.content);
        return html.trim() ? `<p>${html}</p>` : "";
      }
      case "heading": {
        const level = Number(node.attrs?.level ?? 2);
        const safeLevel = HEADING_LEVELS.has(level) ? (level as 2 | 3) : 2;
        const label = textFromNode(node).trim();
        const id = uniqueHeadingId(label || `section-${toc.length + 1}`);
        toc.push({
          id,
          label: label || `Section ${toc.length + 1}`,
          level: safeLevel,
        });
        return `<h${safeLevel} id="${id}">${renderChildren(node.content)}</h${safeLevel}>`;
      }
      case "bulletList":
        return `<ul>${renderChildren(node.content)}</ul>`;
      case "orderedList":
        return `<ol>${renderChildren(node.content)}</ol>`;
      case "listItem":
        return `<li>${renderChildren(node.content)}</li>`;
      case "blockquote":
        return `<blockquote>${renderChildren(node.content)}</blockquote>`;
      case "codeBlock":
        return `<pre><code>${escapeHtml(textFromNode(node))}</code></pre>`;
      case "image": {
        const src = safeImageSrc(String(node.attrs?.src ?? ""));
        if (!src) return "";
        const alt = String(node.attrs?.alt ?? "");
        const title = String(node.attrs?.title ?? "");
        const caption = String(node.attrs?.caption ?? "").trim();
        const image = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ""} loading="lazy" decoding="async" />`;
        return caption ? `<figure>${image}<figcaption>${escapeHtml(caption)}</figcaption></figure>` : `<figure>${image}</figure>`;
      }
      case "horizontalRule":
        return "<hr />";
      case "hardBreak":
        return "<br />";
      case "text":
        return renderMarks(escapeHtml(node.text ?? ""), node.marks);
      default:
        return renderChildren(node.content);
    }
  }

  const html = renderNode(content ?? { type: "doc", content: [] }) || "<p>暂无正文。</p>";
  const text = textFromNode(content).replace(/\s+/g, " ").trim();
  return { html, toc, text };
}

export function renderLegacyHtml(html: string) {
  const normalizedHtml = html.trim();

  if (!normalizedHtml) {
    return {
      html: "<p>暂无正文。</p>",
      toc: [] as TocItem[],
      text: "",
    };
  }

  const toc: TocItem[] = [];
  const headingRegistry = new Map<string, number>();

  function uniqueHeadingId(value: string) {
    const base = value.trim() || `section-${toc.length + 1}`;
    const seen = headingRegistry.get(base) ?? 0;
    headingRegistry.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen + 1}`;
  }

  const withHeadingIds = normalizedHtml.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, levelValue: string, rawAttrs: string, innerHtml: string) => {
      const level = Number(levelValue) as 2 | 3;
      const label = textFromHtml(innerHtml) || `Section ${toc.length + 1}`;
      const existingId = rawAttrs.match(/\sid=(["'])(.*?)\1/i)?.[2]?.trim() ?? "";
      const id = uniqueHeadingId(existingId || slugify(label, "section"));
      const attrsWithoutId = rawAttrs.replace(/\sid=(["']).*?\1/i, "");

      toc.push({ id, label, level });
      return `<h${level}${attrsWithoutId} id="${escapeHtml(id)}">${innerHtml}</h${level}>`;
    }
  );

  return {
    html: withHeadingIds,
    toc,
    text: textFromHtml(normalizedHtml),
  };
}

export function renderStoredContent(contentJson: JSONContent | null | undefined, contentHtml: string | null | undefined) {
  const normalizedHtml = contentHtml?.trim() ?? "";
  return contentJson || !normalizedHtml ? renderDocument(contentJson) : renderLegacyHtml(normalizedHtml);
}

export function estimateReadTime(text: string) {
  const chineseChars = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinWords = text
    .replace(/[\u3400-\u9fff]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const units = chineseChars + latinWords;
  return Math.max(1, Math.ceil(units / 280));
}

export function formatDate(date: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return SITE_DATE_FORMATTER.format(parsed);
}

export function formatDateTime(date: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return SITE_DATE_TIME_FORMATTER.format(parsed);
}

export function getSiteYearMonth(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    year: Number(SITE_YEAR_FORMATTER.format(parsed)),
    month: Number(SITE_MONTH_FORMATTER.format(parsed)),
  };
}

export function formatReadTime(minutes: number) {
  return `${Math.max(1, minutes)} 分钟阅读`;
}

export function excerptFromText(text: string, max = 110) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}…`;
}

export function isPubliclyVisible(status: string, publishedAt: string | null) {
  if (!PUBLICLY_VISIBLE_POST_STATUS_SET.has(status) || !publishedAt) return false;
  const publishedTime = new Date(publishedAt).getTime();
  return !Number.isNaN(publishedTime) && publishedTime <= Date.now();
}
