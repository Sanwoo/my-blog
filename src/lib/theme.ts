export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";

export const THEME_STORAGE_KEY = "echoes-theme:v1";

export function resolveThemePreference(storedTheme: string | null, prefersDark: boolean): ThemeMode {
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return prefersDark ? "dark" : "light";
}

export function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }

  return "system";
}

export function resolveThemeFromPreference(
  preference: ThemePreference,
  prefersDark: boolean
): ThemeMode {
  return preference === "system" ? (prefersDark ? "dark" : "light") : preference;
}

export function applyThemeToDocument(preference: ThemePreference, prefersDark?: boolean) {
  const resolved = resolveThemeFromPreference(
    preference,
    prefersDark ?? window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;

  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
