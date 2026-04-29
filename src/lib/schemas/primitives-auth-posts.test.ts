import { describe, expect, it, vi } from "vitest";
import {
  appPathSchema,
  avatarFileSchema,
  emailAddressSchema,
  firstSearchParamValueSchema,
  normalizedEmailInputSchema,
} from "@/lib/schemas/primitives";
import { signInInputSchema, signUpInputSchema } from "@/lib/schemas/auth";
import {
  editorIntentValidationSchema,
  requiredSlugSchema,
  scheduledPublishAtSchema,
} from "@/lib/schemas/posts";

describe("primitive schemas", () => {
  it("normalizes emails and catches common provider typos", () => {
    expect(normalizedEmailInputSchema.parse(" USER@Example.COM ")).toBe("user@example.com");
    expect(emailAddressSchema.safeParse("user@gmail.co").success).toBe(false);
  });

  it("keeps app paths internal and unwraps first search values", () => {
    expect(appPathSchema.safeParse("/posts/hello").success).toBe(true);
    expect(appPathSchema.safeParse("//evil.test").success).toBe(false);
    expect(firstSearchParamValueSchema.parse(["first", "second"])).toBe("first");
    expect(firstSearchParamValueSchema.parse(undefined)).toBe("");
  });

  it("validates avatar files", () => {
    const ok = new File(["x"], "avatar.png", { type: "image/png" });
    const bad = new File(["x"], "avatar.txt", { type: "text/plain" });

    expect(avatarFileSchema.safeParse(ok).success).toBe(true);
    expect(avatarFileSchema.safeParse(bad).success).toBe(false);
  });
});

describe("auth schemas", () => {
  it("normalizes sign-in and sign-up payloads", () => {
    expect(signInInputSchema.parse({ email: " USER@Example.COM ", password: "secret" })).toEqual({
      email: "user@example.com",
      password: "secret",
    });
    expect(signUpInputSchema.parse({
      nickname: " Sanwoo ",
      email: " USER@Example.COM ",
      password: "secret",
      passwordConfirm: "secret",
    })).toMatchObject({
      nickname: "Sanwoo",
      email: "user@example.com",
    });
  });

  it("rejects incomplete auth payloads", () => {
    expect(signInInputSchema.safeParse({ email: "", password: "" }).success).toBe(false);
    expect(signUpInputSchema.safeParse({
      nickname: "",
      email: "bad",
      password: "123",
      passwordConfirm: "456",
    }).success).toBe(false);
  });
});

describe("post editor schemas", () => {
  it("normalizes required slugs", () => {
    expect(requiredSlugSchema.parse(" Hello World! ")).toBe("hello-world");
    expect(requiredSlugSchema.safeParse("!!!").success).toBe(false);
  });

  it("validates future scheduled publish times", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-27T00:00:00Z"));

    expect(scheduledPublishAtSchema.parse("2026-04-27T01:00:00Z")).toBe("2026-04-27T01:00:00.000Z");
    expect(scheduledPublishAtSchema.safeParse("2026-04-26T23:00:00Z").success).toBe(false);

    vi.useRealTimers();
  });

  it("requires title, slug, and future date only for publishing intents", () => {
    expect(editorIntentValidationSchema.safeParse({
      intent: "save_draft",
      title: "",
      slug: "",
      publishAt: "",
    }).success).toBe(true);

    expect(editorIntentValidationSchema.safeParse({
      intent: "publish_now",
      title: "",
      slug: "",
      publishAt: "",
    }).success).toBe(false);
  });
});
