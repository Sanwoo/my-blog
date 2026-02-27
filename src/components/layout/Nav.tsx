"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, PenSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "#", label: "文章" },
  { href: "#", label: "笔记" },
  { href: "#", label: "时间线" },
  { href: "#", label: "关于" },
];

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full top-0 z-50 glass-nav transition-all duration-300 ${
        scrolled ? "border-b border-light-border dark:border-dark-border" : ""
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-14">
          {/* Logo / Avatar */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-light-border dark:ring-dark-border group-hover:ring-light-accent dark:group-hover:ring-dark-accent transition-all">
              <Image
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="avatar"
                width={32}
                height={32}
                className="object-cover"
                unoptimized
              />
            </div>
          </Link>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  label === "首页"
                    ? "text-light-accent dark:text-dark-accent font-medium"
                    : "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link
                href="/editor"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-light-accent dark:text-dark-accent hover:bg-light-accent-soft dark:hover:bg-dark-accent-soft rounded-lg transition-colors"
              >
                <PenSquare width={14} height={14} />
              </Link>
            )}
            <ThemeToggle />
            {user && (
              <div className="hidden md:block relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-light-border dark:ring-dark-border ml-1">
                <Image
                  src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt="avatar"
                  width={28}
                  height={28}
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <button
              type="button"
              className="md:hidden p-1.5 text-light-text dark:text-dark-text hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded-lg transition-colors"
              aria-label="菜单"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X width={20} height={20} /> : <Menu width={20} height={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg">
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm ${
                  label === "首页"
                    ? "text-light-accent dark:text-dark-accent font-medium bg-light-accent-soft dark:bg-dark-accent-soft"
                    : "text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/editor"
                className="px-3 py-2 rounded-lg text-sm text-light-accent dark:text-dark-accent"
                onClick={() => setMobileOpen(false)}
              >
                写文章
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
