import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { firstIssueMessage, parseExternalArray, parseExternalValue } from "@/lib/schemas/runtime";

describe("schema runtime helpers", () => {
  it("parses valid values and returns null for invalid values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const schema = z.object({ id: z.string() });

    expect(parseExternalValue({ id: "ok" }, schema, "scope")).toEqual({ id: "ok" });
    expect(parseExternalValue({ id: 1 }, schema, "scope")).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("parses arrays by dropping invalid entries", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const schema = z.object({ id: z.string() });

    expect(parseExternalArray([{ id: "a" }, { id: 1 }, { id: "b" }], schema, "rows")).toEqual([
      { id: "a" },
      { id: "b" },
    ]);
    expect(parseExternalArray("not-array", schema, "rows")).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("returns the first zod issue message", () => {
    const result = z.object({ id: z.string().min(2, "too short") }).safeParse({ id: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstIssueMessage(result.error, "fallback")).toBe("too short");
    }
  });
});
