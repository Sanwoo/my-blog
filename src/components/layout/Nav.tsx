"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, PenSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { href: "/", label: "首页", active: true },
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
    <nav className={`fixed w-full top-0 z-50 glass-nav transition-all duration-300 ${scrolled ? "border-b border-light-border/60 dark:border-dark-border/60" : ""}`}>
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Avatar */}
          <Link href="/" className="flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden hover:opacity-80 transition-opacity">
              <Image src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" width={36} height={36} className="object-cover" unoptimized />
            </div>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, active }) => (
              <Link
                key={label}
                href={href}
                className={`px-3.5 py-1.5 text-[15px] rounded-lg transition-colors duration-200 ${
                  active
                    ? "text-light-accent dark:text-dark-accent font-medium"
                    : "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <Link href="/editor" className="p-2 text-light-muted dark:text-dark-muted hover:text-light-accent dark:hover:text-dark-accent transition-colors duration-200 rounded-lg">
                <PenSquare width={16} height={16} />
              </Link>
            )}
            <ThemeToggle />
            {user && (
              <div className="hidden md:block w-7 h-7 rounded-full overflow-hidden ml-0.5">
                <Image src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="" width={28} height={28} className="object-cover" unoptimized />
              </div>
            )}
            <button
              type="button"
              className="md:hidden p-2 text-light-text-secondary dark:text-dark-text-secondary rounded-lg"
              aria-label="菜单"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X width={20} height={20} /> : <Menu width={20} height={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg px-6 py-3 space-y-0.5">
          {navLinks.map(({ href, label, active }) => (
            <Link key={label} href={href} className={`block px-3 py-2.5 rounded-lg text-[15px] ${active ? "text-light-accent dark:text-dark-accent font-medium" : "text-light-text-secondary dark:text-dark-text-secondary"}`} onClick={() => setMobileOpen(false)}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
