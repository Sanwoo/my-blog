import { AUTH_DIALOG_MODES, authDialogModeSchema } from "@/lib/schemas/navigation";
import { appPathSchema } from "@/lib/schemas/primitives";

export type AuthDialogMode = (typeof AUTH_DIALOG_MODES)[number];

export function safeAppPath(path: string | null | undefined) {
  const result = appPathSchema.safeParse(path);
  return result.success ? result.data : "/";
}

export function normalizeAuthDialogMode(mode: string | null | undefined): AuthDialogMode {
  return authDialogModeSchema.safeParse(mode).data ?? "sign-in";
}

export function authDialogHref(
  next: string | null | undefined,
  options?: { mode?: AuthDialogMode; error?: string | null }
) {
  const params = new URLSearchParams({
    auth: "1",
    next: safeAppPath(next),
    mode: options?.mode ?? "sign-in",
  });

  if (options?.error?.trim()) {
    params.set("error", options.error.trim());
  }

  return `/?${params.toString()}`;
}

export function buildPathWithQuery(
  pathname: string,
  input: { q?: string; category?: string; tag?: string; page?: number },
  hash?: string
) {
  const params = new URLSearchParams();

  if (input.q) params.set("q", input.q);
  if (input.category) params.set("category", input.category);
  if (input.tag) params.set("tag", input.tag);
  if (input.page && input.page > 1) params.set("page", String(input.page));

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}
