import type { z } from "zod";
import { logSchemaMismatch } from "@/lib/schemas/runtime";

export function versionedStorageKey(namespace: string, version: string, suffix: string) {
  return `${namespace}:${version}:${suffix}`;
}

export function readJsonStorage<T>(key: string, schema?: z.ZodType<T>): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!schema) {
      return parsed as T;
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      logSchemaMismatch(`storage:${key}`, result.error);
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

export function writeJsonStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

export function removeStorageItem(key: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}
