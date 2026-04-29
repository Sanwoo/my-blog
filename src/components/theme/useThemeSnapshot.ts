"use client";

import { useSyncExternalStore } from "react";
import {
  applyThemeToDocument,
  normalizeThemePreference,
  resolveThemeFromPreference,
  THEME_STORAGE_KEY,
  type ThemeMode,
  type ThemePreference,
} from "@/lib/theme";

type ThemeSnapshot = {
  preference: ThemePreference;
  resolved: ThemeMode;
};

const DEFAULT_THEME_SNAPSHOT: ThemeSnapshot = {
  preference: "system",
  resolved: "light",
};

const listeners = new Set<() => void>();
let teardownThemeSubscriptions: (() => void) | null = null;
let cachedThemeSnapshot = DEFAULT_THEME_SNAPSHOT;

function readThemeSnapshot(): ThemeSnapshot {
  if (typeof document === "undefined") {
    return DEFAULT_THEME_SNAPSHOT;
  }

  return {
    preference: normalizeThemePreference(document.documentElement.dataset.themePreference),
    resolved: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  };
}

function getThemeSnapshot(): ThemeSnapshot {
  const nextSnapshot = readThemeSnapshot();

  if (
    cachedThemeSnapshot.preference === nextSnapshot.preference &&
    cachedThemeSnapshot.resolved === nextSnapshot.resolved
  ) {
    return cachedThemeSnapshot;
  }

  cachedThemeSnapshot = nextSnapshot;
  return cachedThemeSnapshot;
}

function notifyThemeListeners() {
  listeners.forEach((listener) => listener());
}

function ensureThemeSubscriptions() {
  if (typeof window === "undefined" || teardownThemeSubscriptions) return;

  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const syncSystemTheme = () => {
    if (getThemeSnapshot().preference === "system") {
      applyThemeToDocument("system", media.matches);
    }

    notifyThemeListeners();
  };

  const syncWithDocument = (event: StorageEvent) => {
    if (event.key !== null && event.key !== THEME_STORAGE_KEY) {
      return;
    }

    applyThemeToDocument(normalizeThemePreference(event.newValue), media.matches);
    notifyThemeListeners();
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", syncSystemTheme);
    window.addEventListener("storage", syncWithDocument);

    teardownThemeSubscriptions = () => {
      media.removeEventListener("change", syncSystemTheme);
      window.removeEventListener("storage", syncWithDocument);
      teardownThemeSubscriptions = null;
    };
  }
}

function subscribeTheme(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  ensureThemeSubscriptions();
  listeners.add(listener);

  const frame = window.requestAnimationFrame(listener);

  return () => {
    window.cancelAnimationFrame(frame);
    listeners.delete(listener);

    if (listeners.size === 0 && teardownThemeSubscriptions) {
      teardownThemeSubscriptions();
    }
  };
}

export function setThemePreference(nextPreference: ThemePreference) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = resolveThemeFromPreference(nextPreference, prefersDark);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
  } catch {
    // Ignore storage failures and still apply the requested theme in-memory.
  }

  applyThemeToDocument(nextPreference, prefersDark);
  notifyThemeListeners();
  return resolved;
}

export function useThemeSnapshot() {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => DEFAULT_THEME_SNAPSHOT);
}
