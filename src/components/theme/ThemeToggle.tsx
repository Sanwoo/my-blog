"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const toggle = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const next = isDark ? "light" : "dark";
    localStorage.setItem("theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 text-light-text dark:text-dark-text hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
      aria-label="切换主题"
    >
      <Moon
        width={20}
        height={20}
        className="hidden dark:block"
        aria-hidden
      />
      <Sun
        width={20}
        height={20}
        className="block dark:hidden"
        aria-hidden
      />
    </button>
  );
}
