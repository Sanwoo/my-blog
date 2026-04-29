import { absoluteUrl } from "@/lib/site";

const SHARE_SUMMARY_MAX_LENGTH = 96;
const CLIPBOARD_SUMMARY_MAX_LENGTH = 140;

function normalizeShareText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateShareText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  if (maxLength <= 1) return value.slice(0, maxLength);

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeVersionKey(value: string | null | undefined) {
  const normalized = normalizeShareText(value ?? "");
  if (!normalized) return "";

  const time = Date.parse(normalized);
  return Number.isNaN(time) ? normalized : String(time);
}

export function getPostAbsoluteUrl(slug: string) {
  return absoluteUrl(`/posts/${slug}`);
}

export function getShareSummary(value: string | null | undefined, fallback = "", maxLength = SHARE_SUMMARY_MAX_LENGTH) {
  const normalized = normalizeShareText(value ?? "") || normalizeShareText(fallback);
  return truncateShareText(normalized, maxLength);
}

export function buildPostOgImageUrl(slug: string, versionKey?: string | null) {
  const url = new URL(absoluteUrl(`/posts/${slug}/opengraph-image`));
  const version = normalizeVersionKey(versionKey);

  if (version) {
    url.searchParams.set("v", version);
  }

  return url.toString();
}

export function getPostShareText(title: string, excerpt?: string | null) {
  const normalizedTitle = normalizeShareText(title);
  const summary = getShareSummary(excerpt, "");
  return summary ? `${normalizedTitle}｜${summary}` : normalizedTitle;
}

export function buildXShareUrl(url: string, text: string) {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function buildTelegramShareUrl(url: string, text: string) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function buildWeiboShareUrl(url: string, text: string) {
  return `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
}

export function buildClipboardShareText(title: string, url: string, excerpt?: string | null) {
  const normalizedTitle = normalizeShareText(title);
  const summary = getShareSummary(excerpt, "", CLIPBOARD_SUMMARY_MAX_LENGTH);
  return [normalizedTitle, summary, url].filter(Boolean).join("\n");
}
