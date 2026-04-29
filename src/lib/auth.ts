import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { handleFromEmail, normalizeEmail } from "@/lib/identity";
import { authDialogHref, safeAppPath } from "@/lib/navigation";
import { accountProfileRowSchema } from "@/lib/schemas/account";
import { parseExternalValue } from "@/lib/schemas/runtime";
import { PROFILE_SELECT_FIELDS, normalizedProfileRecord, type ProfileRecord, type StoredProfileRecord, viewerSessionFromProfileRecord } from "@/lib/profile";
import type { ProfileRole, ViewerSession } from "@/lib/types";
import { getSupabaseAuthServer, getSupabaseServer } from "@/lib/supabase-server";

const ADMIN_EMAIL = normalizeEmail(process.env.ADMIN_EMAIL ?? "");

function isAuthSessionMissingError(error: unknown) {
  return error instanceof Error && error.name === "AuthSessionMissingError";
}

function isAdminEmail(email: string | null | undefined) {
  return Boolean(ADMIN_EMAIL) && normalizeEmail(email ?? "") === ADMIN_EMAIL;
}

function profileRoleFromUser(user: User): ProfileRole {
  return isAdminEmail(user.email) ? "author" : "reader";
}

async function getProfileByIdUncached(userId: string) {
  const { data, error } = await getSupabaseServer()
    .from("profiles")
    .select(PROFILE_SELECT_FIELDS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getProfileById]", error);
    return null;
  }

  return parseExternalValue(data ?? null, accountProfileRowSchema, `auth:profile:${userId}`);
}

const getProfileById = cache(async (userId: string) => getProfileByIdUncached(userId));

export const getOptionalAuthenticatedUser = cache(async () => {
  try {
    const supabase = await getSupabaseAuthServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (isAuthSessionMissingError(error)) {
        return null;
      }

      console.error("[getOptionalAuthenticatedUser]", error);
      return null;
    }

    return user;
  } catch (error) {
    if (!isAuthSessionMissingError(error)) {
      console.error("[getOptionalAuthenticatedUser]", error);
    }

    return null;
  }
});

async function upsertProfileRow(
  user: User,
  existingProfile?: ProfileRecord | null
): Promise<StoredProfileRecord> {
  const nextProfile = normalizedProfileRecord(user, profileRoleFromUser(user), existingProfile);
  const shouldSync =
    !existingProfile ||
    existingProfile.role !== nextProfile.role ||
    existingProfile.display_name !== nextProfile.display_name ||
    existingProfile.handle !== nextProfile.handle ||
    existingProfile.avatar_url !== nextProfile.avatar_url ||
    existingProfile.display_name_customized !== nextProfile.display_name_customized ||
    existingProfile.avatar_customized !== nextProfile.avatar_customized ||
    existingProfile.avatar_storage_path !== nextProfile.avatar_storage_path;

  if (!shouldSync) {
    return nextProfile;
  }

  const { error } = await getSupabaseServer().from("profiles").upsert(nextProfile, {
    onConflict: "id",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error("[upsertProfileRow]", error);
    throw new Error("PROFILE_SYNC_FAILED");
  }

  return nextProfile;
}

export type SyncedProfileState = {
  viewer: ViewerSession;
  profile: StoredProfileRecord;
};

export function safeNextPath(next: string | null | undefined) {
  return safeAppPath(next);
}

export async function syncProfileStateFromUser(
  user: User,
  options?: {
    existingProfile?: ProfileRecord | null;
    useCachedProfile?: boolean;
  }
): Promise<SyncedProfileState> {
  const profile =
    options?.existingProfile !== undefined
      ? options.existingProfile
      : options?.useCachedProfile === false
        ? await getProfileByIdUncached(user.id)
        : await getProfileById(user.id);
  const syncedProfile = await upsertProfileRow(user, profile);
  const viewer = viewerSessionFromProfileRecord(user, syncedProfile.role, syncedProfile);

  return {
    viewer,
    profile: syncedProfile,
  };
}

export async function syncProfileFromUser(user: User) {
  const { viewer } = await syncProfileStateFromUser(user);
  return viewer;
}

async function getAuthenticatedUser() {
  return getOptionalAuthenticatedUser();
}

export const getViewerFromCookies = cache(async () => {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  const { viewer } = await syncProfileStateFromUser(user);
  return viewer;
});

export async function requireViewer() {
  const viewer = await getViewerFromCookies();

  if (!viewer) {
    throw new Error("UNAUTHORIZED");
  }

  return viewer;
}

export async function requireAuthor() {
  const viewer = await requireViewer();

  if (!viewer.isAuthor) {
    throw new Error("FORBIDDEN");
  }

  await ensureProfile(viewer);
  return viewer;
}

export async function requireAuthorOrRedirect(next: string) {
  try {
    return await requireAuthor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect(authDialogHref(next));
    }

    throw error;
  }
}

export async function requireAuthorOrNotFound(next: string) {
  try {
    return await requireAuthor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect(authDialogHref(next));
    }

    notFound();
  }
}

export async function ensureProfile(viewer: ViewerSession) {
  const user = await getAuthenticatedUser();

  if (user && user.id === viewer.id) {
    await syncProfileStateFromUser(user, { useCachedProfile: false });
    return;
  }

  const { error } = await getSupabaseServer().from("profiles").upsert(
    {
      id: viewer.id,
      display_name: viewer.displayName,
      handle: viewer.handle || handleFromEmail(viewer.email || viewer.id),
      avatar_url: viewer.avatarUrl,
      role: viewer.isAuthor ? "author" : "reader",
      display_name_customized: true,
      avatar_customized: viewer.avatarUrl ? true : false,
      avatar_storage_path: null,
    },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    console.error("[ensureProfile]", error);
  }
}
