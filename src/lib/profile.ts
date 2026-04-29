import type { User } from "@supabase/supabase-js";
import { displayNameFromEmail, handleFromEmail, normalizeEmail } from "@/lib/identity";
import { accountProfileRowSchema } from "@/lib/schemas/account";
import { authAppMetadataSchema, authIdentitySchema, authUserMetadataSchema, cachedProfileSchema } from "@/lib/schemas/auth";
import { parseExternalArray, parseExternalValue } from "@/lib/schemas/runtime";
import type { ProfileRole, ViewerSession } from "@/lib/types";
import type { z } from "zod";

export type ProfileRecord = z.infer<typeof accountProfileRowSchema>;
export type CachedProfile = z.infer<typeof cachedProfileSchema>;
export type StoredProfileRecord = Omit<NonNullable<ProfileRecord>, "display_name" | "handle" | "role" | "display_name_customized" | "avatar_customized"> & {
  display_name: string;
  handle: string;
  role: ProfileRole;
  display_name_customized: boolean;
  avatar_customized: boolean;
};

export const PROFILE_SELECT_FIELDS = [
  "id",
  "display_name",
  "handle",
  "avatar_url",
  "role",
  "display_name_customized",
  "avatar_customized",
  "avatar_storage_path",
].join(", ");

export function userMetadataFromUser(user: User) {
  return parseExternalValue(user.user_metadata ?? {}, authUserMetadataSchema, `profile:user_metadata:${user.id}`);
}

export function appMetadataFromUser(user: User) {
  return parseExternalValue(user.app_metadata ?? {}, authAppMetadataSchema, `profile:app_metadata:${user.id}`);
}

function identitiesFromUser(user: User) {
  return parseExternalArray(user.identities ?? [], authIdentitySchema, `profile:identities:${user.id}`);
}

export function hasIdentityProvider(user: User, provider: string) {
  const identities = identitiesFromUser(user);
  const appMetadata = appMetadataFromUser(user);

  return Boolean(
    identities.some((identity) => identity.provider === provider) ||
      appMetadata?.provider === provider
  );
}

export function hasAuthorRoleHint(user: User) {
  const appMetadata = appMetadataFromUser(user);
  const userMetadata = userMetadataFromUser(user);

  return (
    appMetadata?.role === "author" ||
    userMetadata?.role === "author" ||
    userMetadata?.is_author === true ||
    userMetadata?.isAuthor === true
  );
}

export function resolveViewerRole(
  user: User,
  options?: {
    cachedRole?: ProfileRole | null;
    fallbackIsAuthor?: boolean;
  }
): ProfileRole {
  if (options?.cachedRole) {
    return options.cachedRole;
  }

  return options?.fallbackIsAuthor === true || hasAuthorRoleHint(user)
    ? "author"
    : "reader";
}

export function providerDisplayName(user: User, email = normalizeEmail(user.email ?? "")) {
  const userMetadata = userMetadataFromUser(user);

  return displayNameFromEmail(
    email,
    userMetadata?.display_name ?? null,
    userMetadata?.nickname ?? null,
    userMetadata?.name ?? null,
    userMetadata?.full_name ?? null,
    userMetadata?.user_name ?? null
  );
}

export function providerAvatarUrl(user: User) {
  return userMetadataFromUser(user)?.avatar_url ?? null;
}

export function normalizedProfileRecord(
  user: User,
  role: ProfileRole,
  profile?: ProfileRecord | null
): StoredProfileRecord {
  const email = normalizeEmail(user.email ?? "");
  const currentDisplayName = profile?.display_name?.trim() ?? "";
  const currentAvatarUrl = profile?.avatar_url?.trim() ?? "";
  const currentHandle = profile?.handle?.trim() ?? "";
  const isGithubLinked = hasIdentityProvider(user, "github");
  const displayNameCustomized = profile?.display_name_customized === true;
  const avatarCustomized = profile?.avatar_customized === true;
  const nextDisplayName = displayNameCustomized
    ? currentDisplayName || providerDisplayName(user, email)
    : providerDisplayName(user, email);
  const providerAvatar = isGithubLinked ? providerAvatarUrl(user) : null;
  const nextAvatarUrl = avatarCustomized
    ? currentAvatarUrl || null
    : providerAvatar;

  return {
    id: user.id,
    display_name: nextDisplayName,
    handle: currentHandle || handleFromEmail(email || user.id),
    avatar_url: nextAvatarUrl,
    role,
    display_name_customized: displayNameCustomized,
    avatar_customized: avatarCustomized,
    avatar_storage_path: profile?.avatar_storage_path ?? null,
  };
}

export function viewerSessionFromProfileRecord(
  user: User,
  role: ProfileRole,
  profile?: ProfileRecord | null
): ViewerSession {
  const normalizedProfile = normalizedProfileRecord(user, role, profile);

  return {
    id: user.id,
    email: normalizeEmail(user.email ?? ""),
    isAuthor: normalizedProfile.role === "author",
    displayName: normalizedProfile.display_name,
    avatarUrl: normalizedProfile.avatar_url,
    handle: normalizedProfile.handle,
  };
}

export function profileRecordFromCachedProfile(
  userId: string,
  cachedProfile?: CachedProfile | null
): ProfileRecord | null {
  if (!cachedProfile) {
    return null;
  }

  return {
    id: userId,
    display_name: cachedProfile.displayName,
    handle: cachedProfile.handle,
    avatar_url: cachedProfile.avatarUrl ?? null,
    role: cachedProfile.role,
    display_name_customized: true,
    avatar_customized: cachedProfile.avatarUrl ? true : false,
    avatar_storage_path: null,
  };
}

export function viewerSessionFromCachedProfile(
  user: User,
  cachedProfile?: CachedProfile | null,
  options?: {
    fallbackIsAuthor?: boolean;
  }
): ViewerSession {
  const role = resolveViewerRole(user, {
    cachedRole: cachedProfile?.role ?? null,
    fallbackIsAuthor: options?.fallbackIsAuthor,
  });

  return viewerSessionFromProfileRecord(
    user,
    role,
    profileRecordFromCachedProfile(user.id, cachedProfile)
  );
}

export function cachedProfileFromViewer(viewer: ViewerSession): CachedProfile {
  return {
    role: viewer.isAuthor ? "author" : "reader",
    displayName: viewer.displayName,
    handle: viewer.handle,
    avatarUrl: viewer.avatarUrl,
  };
}
