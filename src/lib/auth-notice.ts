import { z } from "zod";

export type PendingAuthNotice =
  | { kind: "oauth-sign-in" }
  | { kind: "github-link" }
  | { kind: "password-sign-in" }
  | { kind: "password-sign-up"; displayName: string };

const STORAGE_KEY = "blog-auth-notice";
const AUTH_NOTICE_EVENT = "auth-notice";
const pendingAuthNoticeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("oauth-sign-in") }),
  z.object({ kind: z.literal("github-link") }),
  z.object({ kind: z.literal("password-sign-in") }),
  z.object({
    kind: z.literal("password-sign-up"),
    displayName: z.string().trim().min(1),
  }),
]);

function safeSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readPendingAuthNotice() {
  const storage = safeSessionStorage();
  const raw = storage?.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = pendingAuthNoticeSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writePendingAuthNotice(notice: PendingAuthNotice) {
  const parsed = pendingAuthNoticeSchema.parse(notice);
  safeSessionStorage()?.setItem(STORAGE_KEY, JSON.stringify(parsed));

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_NOTICE_EVENT));
  }
}

export function clearPendingAuthNotice() {
  safeSessionStorage()?.removeItem(STORAGE_KEY);
}

export function subscribePendingAuthNotice(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleNotice = () => listener();
  window.addEventListener(AUTH_NOTICE_EVENT, handleNotice);

  return () => {
    window.removeEventListener(AUTH_NOTICE_EVENT, handleNotice);
  };
}
