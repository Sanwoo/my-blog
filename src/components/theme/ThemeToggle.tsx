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
      className="p-1.5 text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded-lg transition-colors"
      aria-label="切换主题"
    >
      <Moon width={16} height={16} className="hidden dark:block" aria-hidden />
      <Sun width={16} height={16} className="block dark:hidden" aria-hidden />
    </button>
  );
}
