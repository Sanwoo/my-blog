"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const toggle = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const next = isDark ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 text-light-muted dark:text-dark-muted hover:text-light-text-secondary dark:hover:text-dark-text-secondary transition-colors duration-200 rounded-lg"
      aria-label="切换主题"
    >
      <Moon width={16} height={16} className="hidden dark:block" aria-hidden />
      <Sun width={16} height={16} className="block dark:hidden" aria-hidden />
    </button>
  );
}
