import { emailAddressSchema, normalizedEmailInputSchema } from "@/lib/schemas/primitives";

export function normalizeEmail(email: string) {
  return normalizedEmailInputSchema.parse(email);
}

export function isValidEmail(email: string) {
  return emailAddressSchema.safeParse(email).success;
}

export function handleFromEmail(email: string) {
  const base = email.split("@")[0] || "reader";
  return `@${base.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "reader"}`;
}

export function firstReadableText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

export function displayNameFromEmail(email: string, ...values: Array<string | null | undefined>) {
  return firstReadableText(...values, email, "Reader");
}

export function avatarInitialFromSeed(displayName: string | null | undefined, fallbackSeed?: string | null) {
  const seed = firstReadableText(displayName, fallbackSeed, "U");
  return seed.trim().charAt(0).toUpperCase() || "U";
}

export function avatarInitialFromEmail(email: string, displayName?: string | null) {
  return avatarInitialFromSeed(displayName, email);
}

export function avatarInitialFromViewer(viewer: {
  displayName: string;
  email: string;
}) {
  return avatarInitialFromSeed(viewer.displayName, viewer.email);
}

export function avatarInitialFromProfile(profile: {
  displayName: string;
  handle: string;
}) {
  return avatarInitialFromSeed(profile.displayName, profile.handle);
}
