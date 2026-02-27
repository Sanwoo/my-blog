import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-light-border dark:border-dark-border mt-20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-light-muted dark:text-dark-muted">
            © 2024 Echoes Blog. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-light-muted dark:text-dark-muted">
            <Link
              href="#"
              className="hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              RSS
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
