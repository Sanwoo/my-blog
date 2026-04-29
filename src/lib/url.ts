const HTTP_PROTOCOL_RE = /^https?:\/\//i;
const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

type HeaderReader = {
  get(name: string): string | null;
};

function firstHeaderValue(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() ?? "";
}

function defaultProtocolForHost(host: string) {
  return LOCAL_HOST_RE.test(host) ? "http" : "https";
}

export function normalizeOrigin(origin: string) {
  const trimmed = origin.trim();

  if (!trimmed) {
    throw new Error("Origin is required.");
  }

  const withProtocol = HTTP_PROTOCOL_RE.test(trimmed)
    ? trimmed
    : `${defaultProtocolForHost(trimmed)}://${trimmed}`;

  return new URL(withProtocol).origin;
}

export function absoluteUrl(origin: string, path = "/") {
  const normalizedOrigin = normalizeOrigin(origin);
  return `${normalizedOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function originFromHeaders(headers: HeaderReader) {
  const forwardedHost = firstHeaderValue(headers.get("x-forwarded-host"));
  const host = forwardedHost || firstHeaderValue(headers.get("host"));

  if (!host) {
    return null;
  }

  if (HTTP_PROTOCOL_RE.test(host)) {
    return normalizeOrigin(host);
  }

  const protocol = firstHeaderValue(headers.get("x-forwarded-proto")) || defaultProtocolForHost(host);
  return normalizeOrigin(`${protocol}://${host}`);
}

export function originFromRequest(request: Request) {
  return new URL(request.url).origin;
}

export function absoluteUrlFromBrowser(path = "/") {
  if (typeof window === "undefined") {
    throw new Error("Browser origin is only available in the browser.");
  }

  return absoluteUrl(window.location.origin, path);
}
