"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Menu, X, PenSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "#", label: "技术" },
  { href: "#", label: "设计" },
  { href: "#", label: "生活" },
  { href: "#", label: "关于" },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full top-0 z-50 glass-nav transition-all duration-300 ${
        scrolled ? "shadow-sm" : ""
      }`}
      id="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link
              href="/"
              className="font-serif text-2xl italic font-bold tracking-tight hover:opacity-80 transition-opacity text-light-text dark:text-dark-text"
            >
              Echoes.
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  label === "首页"
                    ? "text-light-text dark:text-dark-text hover:text-light-accent dark:hover:text-dark-accent"
                    : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2 text-light-text dark:text-dark-text hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
              aria-label="搜索"
            >
              <Search width={20} height={20} aria-hidden />
            </button>
            <ThemeToggle />
            {isAdmin && (
              <Link
                href="/editor"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm text-light-accent dark:text-dark-accent hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 rounded-full transition-colors"
              >
                <PenSquare width={16} height={16} />
                写文章
              </Link>
            )}
            {user && (
              <div className="hidden md:block relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-light-border dark:ring-dark-border">
                <Image
                  src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <button
              type="button"
              className="md:hidden p-2 text-light-text dark:text-dark-text hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
              aria-label="菜单"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? (
                <X width={24} height={24} aria-hidden />
              ) : (
                <Menu width={24} height={24} aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`md:hidden absolute w-full bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border py-4 px-6 shadow-xl ${
          mobileOpen ? "block" : "hidden"
        }`}
        id="mobile-menu"
      >
        <div className="flex flex-col space-y-4">
          {navLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className={`text-lg font-medium ${
                label === "首页"
                  ? "text-light-text dark:text-dark-text"
                  : "text-light-muted dark:text-dark-muted"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/editor"
              className="text-lg font-medium text-light-accent dark:text-dark-accent"
              onClick={() => setMobileOpen(false)}
            >
              写文章
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
