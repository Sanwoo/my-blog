import { z } from "zod";
import { cachedProfileSchema, viewerSessionSchema } from "@/lib/schemas/auth";
import { interactionNotificationSchema } from "@/lib/schemas/community";
import { avatarFileSchema, displayNameInputSchema, notificationIdsSchema, okResponseSchema, profileRoleSchema, trimmedStringSchema } from "@/lib/schemas/primitives";

const nonEmptyTrimmedStringSchema = trimmedStringSchema.min(1);

export const accountProfileBodySchema = z.object({
  displayName: z.string().optional(),
});

export const passwordDraftSchema = z
  .object({
    password: z.string(),
    passwordConfirm: z.string(),
  })
  .superRefine((value, context) => {
    if (!value.password || !value.passwordConfirm) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "请输入两次密码。",
      });
      return;
    }

    if (value.password !== value.passwordConfirm) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passwordConfirm"],
        message: "两次输入的密码不一致。",
      });
    }

    if (value.password.length < 6) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "密码至少需要 6 位。",
      });
    }
  });

export const displayNameDraftSchema = z.string().trim().min(1, "昵称不能为空。").max(40, "昵称最多 40 个字符。");
export const avatarUploadBodySchema = z.object({
  file: avatarFileSchema,
});
export const markNotificationsReadBodySchema = z.union([
  z.object({
    all: z.literal(true),
  }),
  z.object({
    ids: notificationIdsSchema,
  }),
]);

export const interactionNotificationQuerySchema = z.object({
  summary: z.literal("1").optional(),
  channel: z.enum(["likes", "replies"]).optional(),
});

export const accountProfileRowSchema = z
  .object({
    id: nonEmptyTrimmedStringSchema,
    display_name: z.string().nullable(),
    handle: z.string().nullable(),
    avatar_url: z.string().nullable(),
    role: profileRoleSchema.nullable(),
    display_name_customized: z.boolean().nullable(),
    avatar_customized: z.boolean().nullable(),
    avatar_storage_path: z.string().nullable(),
  })
  .nullable();

export const accountViewerProfileSchema = z.object({
  displayNameCustomized: z.boolean(),
  avatarCustomized: z.boolean(),
  avatarStoragePath: z.string().nullable(),
  hasGithubIdentity: z.boolean(),
  hasPasswordIdentity: z.boolean(),
  unreadInteractionCount: z.number().int().min(0),
});

export const accountViewerResponseSchema = z.object({
  viewer: viewerSessionSchema,
  profile: accountViewerProfileSchema,
});

export const interactionNotificationUnreadSchema = z.object({
  total: z.number().int().min(0),
  likes: z.number().int().min(0),
  replies: z.number().int().min(0),
});

export const interactionNotificationUnreadRowSchema = z.object({
  total: z.number().int().min(0).nullable().optional(),
  likes: z.number().int().min(0).nullable().optional(),
  replies: z.number().int().min(0).nullable().optional(),
});

export const interactionNotificationsResponseSchema = z.object({
  unread: interactionNotificationUnreadSchema,
  notifications: z.array(interactionNotificationSchema),
});
export const okOnlyResponseSchema = okResponseSchema;

export const notificationRowSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  kind: z.enum(["post_reaction", "post_comment", "comment_like", "comment_reply"]),
  actor_id: nonEmptyTrimmedStringSchema,
  comment_id: z.string().nullable(),
  reply_id: z.string().nullable(),
  post_id: nonEmptyTrimmedStringSchema,
  body_snippet: z.string(),
  created_at: nonEmptyTrimmedStringSchema,
  read_at: z.string().nullable(),
});

export const notificationPostRowSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  slug: nonEmptyTrimmedStringSchema,
  title: nonEmptyTrimmedStringSchema,
});

export const notificationCacheProfileSchema = cachedProfileSchema;
export const accountDisplayNameInputSchema = displayNameInputSchema;
