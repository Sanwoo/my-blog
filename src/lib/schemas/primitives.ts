import type { JSONContent } from "@tiptap/core";
import { z } from "zod";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const COMMON_EMAIL_PROVIDER_TYPOS = new Map<string, string>([
  ["gmail.co", "gmail.com"],
  ["googlemail.co", "googlemail.com"],
  ["outlook.co", "outlook.com"],
  ["hotmail.co", "hotmail.com"],
  ["live.co", "live.com"],
  ["msn.co", "msn.com"],
  ["icloud.co", "icloud.com"],
  ["me.co", "me.com"],
  ["mac.co", "mac.com"],
  ["yahoo.co", "yahoo.com"],
  ["ymail.co", "ymail.com"],
  ["aol.co", "aol.com"],
  ["protonmail.co", "protonmail.com"],
  ["gmx.co", "gmx.com"],
]);

export const trimmedStringSchema = z.string().trim();
export const normalizedEmailInputSchema = trimmedStringSchema.toLowerCase();

function commonEmailProviderTypoMessage(email: string) {
  const [, domain = ""] = email.split("@");
  const suggestedDomain = COMMON_EMAIL_PROVIDER_TYPOS.get(domain);

  return suggestedDomain
    ? `邮箱域名可能不完整，请检查是否应为 ${suggestedDomain}。`
    : null;
}

export const emailAddressSchema = normalizedEmailInputSchema
  .email("请输入有效的邮箱地址。")
  .superRefine((email, context) => {
    const typoMessage = commonEmailProviderTypoMessage(email);

    if (typoMessage) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: typoMessage,
      });
    }
  });
export const displayNameInputSchema = trimmedStringSchema.min(1, "DISPLAY_NAME_REQUIRED").max(40, "DISPLAY_NAME_TOO_LONG");
export const profileRoleSchema = z.enum(["author", "reader"]);
export const postStatusSchema = z.enum(["draft", "scheduled", "published"]);
export const savePostIntentSchema = z.enum([
  "save_draft",
  "save_scheduled",
  "publish_now",
  "save_published_working_copy",
  "publish_working_copy",
  "hide_to_draft",
  "discard_working_copy",
]);
export const notificationIdsSchema = z.array(trimmedStringSchema.min(1)).min(1);
export const appPathSchema = z
  .string()
  .trim()
  .refine((path) => path.startsWith("/") && !path.startsWith("//"), "INVALID_APP_PATH");
export const firstSearchParamValueSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => (Array.isArray(value) ? (value[0] ?? "") : (value ?? "")));
export const jsonContentSchema = z.custom<JSONContent>((value) => typeof value === "object" && value !== null);
export const avatarFileSchema = z
  .custom<File>((value) => typeof File !== "undefined" && value instanceof File, {
    message: "请选择要上传的头像图片。",
  })
  .refine((file) => file.type.startsWith("image/"), "头像只能上传图片文件。")
  .refine((file) => file.size <= MAX_AVATAR_BYTES, "头像图片不能超过 2MB。");
export const okResponseSchema = z.object({
  ok: z.literal(true),
});
