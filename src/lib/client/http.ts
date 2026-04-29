import type { z } from "zod";
import { logSchemaMismatch } from "@/lib/schemas/runtime";

function requestLabel(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  errorMessage = "REQUEST_FAILED",
  schema?: z.ZodType<T>
) {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  const payload = await response.json();

  if (!schema) {
    return payload as T;
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    logSchemaMismatch(`fetch:${requestLabel(input)}`, result.error);
    throw new Error(errorMessage);
  }

  return result.data;
}
