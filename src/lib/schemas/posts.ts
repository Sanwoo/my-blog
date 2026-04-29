import { z } from "zod";
import { slugify } from "@/lib/content";
import { firstSearchParamValueSchema, jsonContentSchema, postStatusSchema, savePostIntentSchema, trimmedStringSchema } from "@/lib/schemas/primitives";

const nonEmptyTrimmedStringSchema = trimmedStringSchema.min(1);

export const relatedLookupSchema = z.object({
  slug: nonEmptyTrimmedStringSchema,
  categoryId: nonEmptyTrimmedStringSchema,
});

export const adjacentLookupSchema = z.object({
  slug: nonEmptyTrimmedStringSchema,
  publishedAt: z.string().nullable(),
});

export const savePostPayloadInputSchema = z.object({
  previousSlug: z.string().optional().nullable(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  categoryId: z.string(),
  tagIds: z.array(z.string()),
  seoDescription: z.string(),
  intent: savePostIntentSchema,
  publishAt: z.string().optional().nullable(),
  contentJson: jsonContentSchema,
});

export const requiredTitleSchema = trimmedStringSchema.min(1, "TITLE_REQUIRED");
export const requiredSlugSchema = z
  .string()
  .transform((value) => slugify(value, ""))
  .refine(Boolean, "SLUG_REQUIRED");

export const scheduledPublishAtSchema = z
  .string()
  .trim()
  .min(1, "PUBLISH_AT_REQUIRED")
  .superRefine((value, context) => {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PUBLISH_AT_INVALID",
      });
      return;
    }

    if (parsed.getTime() <= Date.now()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PUBLISH_AT_MUST_BE_FUTURE",
      });
    }
  })
  .transform((value) => new Date(value).toISOString());

export const editorPageSearchParamsSchema = z.object({
  slug: firstSearchParamValueSchema.transform((value) => value.trim()),
});

export const postSlugParamsSchema = z.object({
  slug: nonEmptyTrimmedStringSchema,
});
export const postSlugInputSchema = nonEmptyTrimmedStringSchema.min(1, "POST_NOT_FOUND");

export const editorIntentValidationSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("save_draft"),
    title: z.string(),
    slug: z.string(),
    publishAt: z.string(),
  }),
  z.object({
    intent: z.literal("hide_to_draft"),
    title: z.string(),
    slug: z.string(),
    publishAt: z.string(),
  }),
  z.object({
    intent: z.literal("discard_working_copy"),
    title: z.string(),
    slug: z.string(),
    publishAt: z.string(),
  }),
  z.object({
    intent: z.literal("publish_now"),
    title: z.string().trim().min(1, "标题不能为空。"),
    slug: z.string().refine((value) => Boolean(slugify(value, "")), "Slug 不能为空。"),
    publishAt: z.string(),
  }),
  z.object({
    intent: z.literal("save_published_working_copy"),
    title: z.string().trim().min(1, "标题不能为空。"),
    slug: z.string().refine((value) => Boolean(slugify(value, "")), "Slug 不能为空。"),
    publishAt: z.string(),
  }),
  z.object({
    intent: z.literal("publish_working_copy"),
    title: z.string().trim().min(1, "标题不能为空。"),
    slug: z.string().refine((value) => Boolean(slugify(value, "")), "Slug 不能为空。"),
    publishAt: z.string(),
  }),
  z.object({
    intent: z.literal("save_scheduled"),
    title: z.string().trim().min(1, "标题不能为空。"),
    slug: z.string().refine((value) => Boolean(slugify(value, "")), "Slug 不能为空。"),
    publishAt: z
      .string()
      .trim()
      .min(1, "定时发布需要设置时间。")
      .superRefine((value, context) => {
        const serializedPublishAt = new Date(value);

        if (Number.isNaN(serializedPublishAt.getTime())) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "发布时间格式无效。",
          });
          return;
        }

        if (serializedPublishAt.getTime() <= Date.now()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "定时发布时间必须晚于当前时间。",
          });
        }
      }),
  }),
]);

export const taxonomyTermRowSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  name: nonEmptyTrimmedStringSchema,
  slug: nonEmptyTrimmedStringSchema,
  archived_at: z.string().optional().nullable(),
});

export const tagAssignmentRowSchema = z.object({
  tag: taxonomyTermRowSchema.nullable().optional(),
});

export const workingCopyTagAssignmentRowSchema = z.object({
  tag: taxonomyTermRowSchema.nullable().optional(),
});

export const workingCopyRowSchema = z.object({
  slug: nonEmptyTrimmedStringSchema,
  title: z.string(),
  excerpt: z.string().optional().nullable(),
  content_json: jsonContentSchema.nullable().optional(),
  content_html: z.string().optional().nullable(),
  category: taxonomyTermRowSchema.nullable().optional(),
  tag_assignments: z.array(workingCopyTagAssignmentRowSchema).optional().nullable(),
  seo_description: z.string().optional().nullable(),
  status: postStatusSchema.optional().nullable(),
  published_at: z.string().optional().nullable(),
  read_time_minutes: z.number().int().min(1).optional(),
  updated_at: nonEmptyTrimmedStringSchema,
});

export const postRecordRowSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  slug: nonEmptyTrimmedStringSchema,
  title: z.string(),
  excerpt: z.string().optional().nullable(),
  content_json: jsonContentSchema.nullable().optional(),
  content_html: z.string().optional().nullable(),
  category: taxonomyTermRowSchema.nullable().optional(),
  tag_assignments: z.array(tagAssignmentRowSchema).optional().nullable(),
  status: postStatusSchema.optional().nullable(),
  seo_description: z.string().optional().nullable(),
  published_at: z.string().optional().nullable(),
  created_at: nonEmptyTrimmedStringSchema,
  updated_at: nonEmptyTrimmedStringSchema,
  read_time_minutes: z.number().int().min(1).optional(),
  comment_count: z.number().int().min(0).optional(),
  reaction_count: z.number().int().min(0).optional(),
  author_id: z.string().optional().nullable(),
  working_copy: z.union([workingCopyRowSchema, z.array(workingCopyRowSchema)]).optional().nullable(),
});

export const publicPostLookupRowSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  slug: nonEmptyTrimmedStringSchema,
  status: postStatusSchema.or(z.string()),
  published_at: z.string().optional().nullable(),
  comment_count: z.number().int().min(0).optional(),
  reaction_count: z.number().int().min(0).optional(),
});

export const taxonomyRowSchema = z.object({
  categories: z.array(taxonomyTermRowSchema).optional(),
  tags: z.array(taxonomyTermRowSchema).optional(),
});

export const sitemapEntryRowSchema = z.object({
  slug: nonEmptyTrimmedStringSchema,
  updated_at: nonEmptyTrimmedStringSchema,
  published_at: z.string().optional().nullable(),
});

export const authorPostSummaryRowSchema = z.object({
  slug: nonEmptyTrimmedStringSchema,
  title: z.string(),
  status: postStatusSchema.or(z.string()),
  updated_at: nonEmptyTrimmedStringSchema,
  published_at: z.string().optional().nullable(),
  working_copy: z.union([z.object({ updated_at: nonEmptyTrimmedStringSchema }), z.array(z.object({ updated_at: nonEmptyTrimmedStringSchema }))]).optional().nullable(),
});

export const authorPostLookupRowSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  slug: nonEmptyTrimmedStringSchema,
  status: postStatusSchema,
  published_at: z.string().nullable(),
});

export const postIdRowSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
});

export const storedDraftInputSchema = z.object({
  previousSlug: z.string().optional().nullable(),
  slug: z.string().optional(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  seoDescription: z.string().optional(),
  status: postStatusSchema.optional(),
  publishAt: z.string().optional(),
  contentJson: jsonContentSchema.optional().nullable(),
  hasWorkingCopy: z.boolean().optional(),
});

export const taxonomyMutationBodySchema = z.object({
  kind: z.enum(["category", "tag"]),
  id: z.string().optional(),
  name: z.string().trim().optional(),
});

export const editorImageUploadSchema = z.object({
  file: z
    .custom<File>((value) => typeof File !== "undefined" && value instanceof File, {
      message: "请选择要上传的图片。",
    })
    .refine((file) => file.type.startsWith("image/"), "只能上传图片文件。")
    .refine((file) => file.size <= 5 * 1024 * 1024, "图片不能超过 5MB。"),
});
