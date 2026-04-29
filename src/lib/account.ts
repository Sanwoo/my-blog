import { excerptFromText, formatDateTime } from "@/lib/content";
import { getOptionalAuthenticatedUser, syncProfileStateFromUser } from "@/lib/auth";
import {
  accountDisplayNameInputSchema,
  interactionNotificationUnreadRowSchema,
  notificationPostRowSchema,
  notificationRowSchema,
} from "@/lib/schemas/account";
import { profileRowSchema } from "@/lib/schemas/community";
import { notificationIdsSchema } from "@/lib/schemas/primitives";
import { firstIssueMessage, parseExternalArray } from "@/lib/schemas/runtime";
import { getSupabaseAuthServer, getSupabaseServer } from "@/lib/supabase-server";
import { mapProfileRow } from "@/lib/community";
import { hasIdentityProvider, type StoredProfileRecord } from "@/lib/profile";
import type { InteractionNotification, InteractionNotificationKind, ViewerSession } from "@/lib/types";

type InteractionNotificationChannel = "likes" | "replies";
type InteractionUnreadSummary = {
  total: number;
  likes: number;
  replies: number;
};

const LIKE_NOTIFICATION_KINDS: InteractionNotificationKind[] = ["post_reaction", "comment_like"];
const COMMENT_NOTIFICATION_KINDS: InteractionNotificationKind[] = ["post_comment", "comment_reply"];

async function getUnreadInteractionSummary(viewerId: string): Promise<InteractionUnreadSummary> {
  const { data, error } = await getSupabaseServer().rpc("get_unread_interaction_summary", {
    p_recipient_id: viewerId,
  });

  if (error) {
    console.error("[getUnreadInteractionSummary]", error);
    return {
      total: 0,
      likes: 0,
      replies: 0,
    };
  }

  const row = parseExternalArray(data ?? [], interactionNotificationUnreadRowSchema, "account:unread_summary")[0] ?? null;

  return {
    total: row?.total ?? 0,
    likes: row?.likes ?? 0,
    replies: row?.replies ?? 0,
  };
}

async function getUnreadInteractionCount(viewerId: string) {
  return (await getUnreadInteractionSummary(viewerId)).total;
}

function buildAccountProfile(
  user: Awaited<ReturnType<typeof getOptionalAuthenticatedUser>>,
  profileRow: StoredProfileRecord,
  unreadInteractionCount: number
) {
  return {
    displayNameCustomized: profileRow.display_name_customized === true,
    avatarCustomized: profileRow.avatar_customized === true,
    avatarStoragePath: profileRow.avatar_storage_path ?? null,
    hasGithubIdentity: user ? hasIdentityProvider(user, "github") : false,
    hasPasswordIdentity: user ? hasIdentityProvider(user, "email") : true,
    unreadInteractionCount,
  };
}

export function buildAccountViewerResponse(accountState: NonNullable<Awaited<ReturnType<typeof getAuthenticatedAccountState>>>) {
  return {
    viewer: accountState.viewer,
    profile: accountState.profile,
  };
}

export async function getAuthenticatedAccountState(options?: { freshProfile?: boolean }) {
  const user = await getOptionalAuthenticatedUser();

  if (!user) {
    return null;
  }

  const unreadPromise = getUnreadInteractionCount(user.id);
  const syncedProfile = await syncProfileStateFromUser(user, {
    useCachedProfile: options?.freshProfile !== true,
  });
  const unreadInteractionCount = await unreadPromise;

  return {
    user,
    viewer: syncedProfile.viewer,
    profileRow: syncedProfile.profile,
    profile: buildAccountProfile(user, syncedProfile.profile, unreadInteractionCount),
  };
}

export async function updateAccountDisplayName(viewer: ViewerSession, displayName: string) {
  const parsedDisplayName = accountDisplayNameInputSchema.safeParse(displayName);
  if (!parsedDisplayName.success) {
    throw new Error(firstIssueMessage(parsedDisplayName.error, "DISPLAY_NAME_REQUIRED"));
  }

  const nextDisplayName = parsedDisplayName.data;

  const { error } = await getSupabaseServer()
    .from("profiles")
    .update({
      display_name: nextDisplayName,
      display_name_customized: true,
    })
    .eq("id", viewer.id);

  if (error) {
    console.error("[updateAccountDisplayName]", error);
    throw new Error("PROFILE_UPDATE_FAILED");
  }

  const authSupabase = await getSupabaseAuthServer();
  const { error: authError } = await authSupabase.auth.updateUser({
    data: {
      display_name: nextDisplayName,
      nickname: nextDisplayName,
      name: nextDisplayName,
    },
  });

  if (authError) {
    console.error("[updateAccountDisplayName:auth_metadata]", authError);
  }

  return nextDisplayName;
}

export async function listInteractionNotifications(
  viewerId: string,
  options?: { summary?: boolean; channel?: InteractionNotificationChannel }
) {
  const supabase = getSupabaseServer();

  if (options?.summary) {
    return {
      unread: await getUnreadInteractionSummary(viewerId),
      notifications: [] as InteractionNotification[],
    };
  }

  let query = supabase
    .from("interaction_notifications")
    .select("id, kind, actor_id, comment_id, reply_id, post_id, body_snippet, created_at, read_at")
    .eq("recipient_id", viewerId)
    .order("created_at", { ascending: false });

  if (options?.channel === "likes") {
    query = query.in("kind", LIKE_NOTIFICATION_KINDS);
  } else if (options?.channel === "replies") {
    query = query.in("kind", COMMENT_NOTIFICATION_KINDS);
  }

  const { data, error } = await query.limit(40);

  if (error) {
    console.error("[listInteractionNotifications:list]", error);
    throw new Error("NOTIFICATIONS_FAILED");
  }

  const notificationRows = parseExternalArray(data ?? [], notificationRowSchema, "account:notification_rows");
  const actorIds = Array.from(new Set(notificationRows.map((row) => row.actor_id)));
  const postIds = Array.from(new Set(notificationRows.map((row) => row.post_id)));

  const [profilesRes, postsRes, unreadRes] = await Promise.all([
    actorIds.length > 0
      ? supabase.from("profiles").select("id, display_name, handle, avatar_url, role").in("id", actorIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length > 0
      ? supabase.from("posts").select("id, slug, title").in("id", postIds)
      : Promise.resolve({ data: [], error: null }),
    getUnreadInteractionSummary(viewerId),
  ]);

  if (profilesRes.error) {
    console.error("[listInteractionNotifications:profiles]", profilesRes.error);
  }

  if (postsRes.error) {
    console.error("[listInteractionNotifications:posts]", postsRes.error);
  }

  const profileRows = parseExternalArray(profilesRes.data ?? [], profileRowSchema, "account:notification_profiles");
  const postRows = parseExternalArray(postsRes.data ?? [], notificationPostRowSchema, "account:notification_posts");
  const profilesMap = new Map(
    profileRows.map((profile) => [
      profile.id,
      mapProfileRow(profile, profile.id, "@reader"),
    ])
  );
  const postsMap = new Map(
    postRows.map((post) => [
      post.id,
      {
        slug: post.slug,
        title: post.title,
      },
    ])
  );

  return {
    unread: unreadRes,
    notifications: notificationRows.flatMap((row) => {
      const actorId = row.actor_id;
      const post = postsMap.get(row.post_id);

      if (!actorId || !post) {
        return [];
      }

      return [
        {
          id: row.id,
          kind: row.kind,
          createdAt: row.created_at,
          readAt: row.read_at,
          bodySnippet: row.kind === "post_reaction" ? "" : excerptFromText(row.body_snippet, 88),
          postSlug: post.slug,
          postTitle: post.title,
          targetCommentId: row.comment_id,
          replyId: row.reply_id,
          actor: profilesMap.get(actorId) ?? mapProfileRow(undefined, actorId),
          formattedDateTime: formatDateTime(row.created_at),
        },
      ];
    }),
  };
}

export async function markInteractionNotificationsRead(viewerId: string, ids?: string[]) {
  const supabase = getSupabaseServer();
  const normalizedIds = ids ? notificationIdsSchema.parse(ids) : undefined;
  const baseQuery = supabase
    .from("interaction_notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("recipient_id", viewerId)
    .is("read_at", null);

  const query = normalizedIds ? baseQuery.in("id", normalizedIds) : baseQuery;
  const { error } = await query;

  if (error) {
    console.error("[markInteractionNotificationsRead]", error);
    throw new Error("NOTIFICATIONS_FAILED");
  }
}
