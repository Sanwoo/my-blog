import { z } from "zod";
import { emailAddressSchema, profileRoleSchema, trimmedStringSchema } from "@/lib/schemas/primitives";

const nonEmptyTrimmedStringSchema = trimmedStringSchema.min(1);

export const viewerSessionSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  email: z.string(),
  isAuthor: z.boolean(),
  displayName: nonEmptyTrimmedStringSchema,
  avatarUrl: nonEmptyTrimmedStringSchema.nullable(),
  handle: nonEmptyTrimmedStringSchema,
});

export const cachedProfileSchema = z.object({
  role: profileRoleSchema,
  displayName: nonEmptyTrimmedStringSchema,
  handle: nonEmptyTrimmedStringSchema,
  avatarUrl: nonEmptyTrimmedStringSchema.nullable().optional(),
});

export const authIdentitySchema = z
  .object({
    provider: z.string().nullable().optional(),
  })
  .passthrough();

export const authUserMetadataSchema = z
  .object({
    display_name: nonEmptyTrimmedStringSchema.optional(),
    nickname: nonEmptyTrimmedStringSchema.optional(),
    name: nonEmptyTrimmedStringSchema.optional(),
    full_name: nonEmptyTrimmedStringSchema.optional(),
    user_name: nonEmptyTrimmedStringSchema.optional(),
    avatar_url: nonEmptyTrimmedStringSchema.optional(),
    role: z.literal("author").optional(),
    is_author: z.boolean().optional(),
    isAuthor: z.boolean().optional(),
  })
  .passthrough();

export const authAppMetadataSchema = z
  .object({
    provider: z.string().optional(),
    role: z.literal("author").optional(),
  })
  .passthrough();

export const authCallbackQuerySchema = z.object({
  next: z.string().optional(),
  code: z.string().optional(),
});

export const signInInputSchema = z
  .object({
    email: z.string(),
    password: z.string(),
  })
  .superRefine((value, context) => {
    const normalizedEmail = value.email.trim().toLowerCase();

    if (!normalizedEmail || !value.password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "请输入邮箱和密码。",
      });
      return;
    }

    if (!emailAddressSchema.safeParse(value.email).success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "请输入有效的邮箱地址。",
      });
    }
  })
  .transform((value) => ({
    email: value.email.trim().toLowerCase(),
    password: value.password,
  }));

export const signUpInputSchema = z
  .object({
    nickname: z.string(),
    email: z.string(),
    password: z.string(),
    passwordConfirm: z.string(),
  })
  .superRefine((value, context) => {
    const nickname = value.nickname.trim();
    const normalizedEmail = value.email.trim().toLowerCase();

    if (!nickname) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nickname"],
        message: "注册时必须填写昵称。",
      });
    } else if (nickname.length > 40) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nickname"],
        message: "昵称最多 40 个字符。",
      });
    }

    if (!normalizedEmail || !value.password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "请输入邮箱和密码。",
      });
      return;
    }

    if (!emailAddressSchema.safeParse(value.email).success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "请输入有效的邮箱地址。",
      });
    }

    if (value.password.length < 6) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "密码至少需要 6 位。",
      });
    }

    if (value.password !== value.passwordConfirm) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passwordConfirm"],
        message: "两次输入的密码不一致。",
      });
    }
  })
  .transform((value) => ({
    nickname: value.nickname.trim(),
    email: value.email.trim().toLowerCase(),
    password: value.password,
    passwordConfirm: value.passwordConfirm,
  }));
