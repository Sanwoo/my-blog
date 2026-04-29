import { describe, expect, it, vi } from "vitest";
import {
  clearPendingAuthNotice,
  readPendingAuthNotice,
  subscribePendingAuthNotice,
  writePendingAuthNotice,
} from "@/lib/auth-notice";

describe("auth notice storage", () => {
  it("stores, validates, clears, and emits auth notices", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePendingAuthNotice(listener);

    writePendingAuthNotice({ kind: "password-sign-up", displayName: "Sanwoo" });
    expect(readPendingAuthNotice()).toEqual({ kind: "password-sign-up", displayName: "Sanwoo" });
    expect(listener).toHaveBeenCalledOnce();

    window.sessionStorage.setItem("blog-auth-notice", JSON.stringify({ kind: "password-sign-up", displayName: "" }));
    expect(readPendingAuthNotice()).toBeNull();

    writePendingAuthNotice({ kind: "oauth-sign-in" });
    clearPendingAuthNotice();
    expect(readPendingAuthNotice()).toBeNull();

    unsubscribe();
  });

  it("ignores malformed session storage values", () => {
    window.sessionStorage.setItem("blog-auth-notice", "{");
    expect(readPendingAuthNotice()).toBeNull();
  });
});
