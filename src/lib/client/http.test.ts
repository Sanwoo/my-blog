import { z } from "zod";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "@/lib/client/http";

describe("fetchJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON with optional schema validation", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ ok: true, count: 2 })));

    await expect(fetchJson("/api/test", undefined, "FAILED", z.object({
      ok: z.literal(true),
      count: z.number(),
    }))).resolves.toEqual({ ok: true, count: 2 });
  });

  it("throws the provided message for non-ok responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));

    await expect(fetchJson("/api/test", undefined, "FAILED")).rejects.toThrow("FAILED");
  });

  it("throws for schema mismatches and logs the scope", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ ok: "yes" })));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(fetchJson(new URL("https://example.test/api"), undefined, "FAILED", z.object({
      ok: z.boolean(),
    }))).rejects.toThrow("FAILED");
    expect(warn.mock.calls[0]?.[0]).toBe("[fetch:https://example.test/api] Invalid data");
    warn.mockRestore();
  });
});
