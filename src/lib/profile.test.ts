import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  cachedProfileFromViewer,
  hasAuthorRoleHint,
  hasIdentityProvider,
  normalizedProfileRecord,
  providerAvatarUrl,
  providerDisplayName,
  resolveViewerRole,
  viewerSessionFromCachedProfile,
  viewerSessionFromProfileRecord,
} from "@/lib/profile";

function user(overrides: Partial<User> = {}) {
  return {
    id: "user-1",
    email: "USER@Example.COM",
    app_metadata: {},
    user_metadata: {},
    identities: [],
    ...overrides,
  } as User;
}

describe("profile helpers", () => {
  it("detects identity providers and author role hints", () => {
    const githubUser = user({
      app_metadata: { provider: "github", role: "author" },
      identities: [{ provider: "email" }, { provider: "github" }] as User["identities"],
    });

    expect(hasIdentityProvider(githubUser, "github")).toBe(true);
    expect(hasAuthorRoleHint(githubUser)).toBe(true);
    expect(resolveViewerRole(githubUser)).toBe("author");
    expect(resolveViewerRole(githubUser, { cachedRole: "reader" })).toBe("reader");
  });

  it("resolves provider profile fields from metadata", () => {
    const metadataUser = user({
      user_metadata: {
        nickname: "Nick",
        avatar_url: "https://example.test/avatar.png",
      },
    });

    expect(providerDisplayName(metadataUser)).toBe("Nick");
    expect(providerAvatarUrl(metadataUser)).toBe("https://example.test/avatar.png");
  });

  it("normalizes stored profile records and viewer sessions", () => {
    const githubUser = user({
      app_metadata: { provider: "github" },
      user_metadata: {
        name: "Provider Name",
        avatar_url: "https://example.test/provider.png",
      },
    });

    expect(normalizedProfileRecord(githubUser, "reader", null)).toMatchObject({
      id: "user-1",
      display_name: "Provider Name",
      handle: "@user",
      avatar_url: "https://example.test/provider.png",
      display_name_customized: false,
      avatar_customized: false,
    });

    expect(viewerSessionFromProfileRecord(githubUser, "author", {
      id: "user-1",
      display_name: "Custom",
      handle: "@custom",
      avatar_url: null,
      role: "author",
      display_name_customized: true,
      avatar_customized: true,
      avatar_storage_path: "avatars/custom.png",
    })).toMatchObject({
      email: "user@example.com",
      isAuthor: true,
      displayName: "Custom",
      handle: "@custom",
      avatarUrl: null,
    });
  });

  it("round-trips cached profiles", () => {
    const viewer = viewerSessionFromCachedProfile(user(), {
      role: "reader",
      displayName: "Cached",
      handle: "@cached",
      avatarUrl: null,
    });

    expect(viewer).toMatchObject({ displayName: "Cached", handle: "@cached", isAuthor: false });
    expect(cachedProfileFromViewer(viewer)).toEqual({
      role: "reader",
      displayName: "Cached",
      handle: "@cached",
      avatarUrl: null,
    });
  });
});
