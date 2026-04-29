import { z } from "zod";
import { describe, expect, it } from "vitest";
import {
  errorMessage,
  firstParamValue,
  jsonFromKnownError,
  parseWithSchema,
  readFormData,
  readJsonBody,
  readRouteParams,
  readSearchParams,
  trimmedSearchParam,
} from "@/lib/server-api";

describe("server api helpers", () => {
  it("parses unknown values with zod schemas", async () => {
    const schema = z.object({ id: z.string().min(1) });

    expect(parseWithSchema({ id: "a" }, schema)).toEqual({ id: "a" });
    expect(parseWithSchema({ id: "" }, schema)).toBeNull();
    await expect(readRouteParams(Promise.resolve({ id: "b" }), schema)).resolves.toEqual({ id: "b" });
  });

  it("reads JSON bodies safely", async () => {
    const schema = z.object({ name: z.string() });

    await expect(readJsonBody(new Request("https://example.test", {
      method: "POST",
      body: JSON.stringify({ name: "Echo" }),
    }), schema)).resolves.toEqual({ name: "Echo" });

    await expect(readJsonBody(new Request("https://example.test", {
      method: "POST",
      body: "{",
    }), schema)).resolves.toBeNull();
  });

  it("normalizes query params from requests and records", () => {
    const schema = z.object({
      q: z.string(),
      tag: z.array(z.string()),
      page: z.string().optional(),
    });

    expect(readSearchParams(new Request("https://example.test?q=hello&tag=a&tag=b"), schema)).toEqual({
      q: "hello",
      tag: ["a", "b"],
    });
    expect(readSearchParams({ q: "hello", tag: ["a", "b"], ignored: undefined }, schema)).toEqual({
      q: "hello",
      tag: ["a", "b"],
    });
    expect(trimmedSearchParam(new Request("https://example.test?q=%20hello%20"), "q")).toBe("hello");
    expect(firstParamValue(["a", "b"])).toBe("a");
  });

  it("reads form data and maps known errors to JSON responses", async () => {
    const formData = new FormData();
    formData.append("name", "Echo");
    formData.append("tag", "a");
    formData.append("tag", "b");

    const parsed = await readFormData(
      new Request("https://example.test", { method: "POST", body: formData }),
      z.object({ name: z.string(), tag: z.array(z.string()) })
    );
    expect(parsed).toEqual({ name: "Echo", tag: ["a", "b"] });

    expect(errorMessage(new Error("KNOWN"))).toBe("KNOWN");
    expect(errorMessage("nope")).toBe("");

    const knownResponse = jsonFromKnownError(
      new Error("KNOWN"),
      { KNOWN: { message: "Known", status: 409 } },
      { message: "Fallback", status: 500 }
    );
    expect(knownResponse.status).toBe(409);
    await expect(knownResponse.json()).resolves.toEqual({ error: "Known", code: "KNOWN" });
  });
});
