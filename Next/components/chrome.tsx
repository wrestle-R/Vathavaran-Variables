"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, ArrowUpRight, Terminal } from "lucide-react";
import { useState } from "react";
export function Header() {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  function toggleTheme() {
    const next =
      document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("varte-theme", next);
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Vathavaran home">
          <span className="brand-mark">
            <Terminal size={21} />
          </span>
          vathavaran<span className="brand-dot">.</span>
        </Link>
        <button
          className="mobile-menu quiet"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
        >
          Menu
        </button>
        <nav className={menu ? "nav open" : "nav"} aria-label="Main navigation">
          <Link
            href="/docs"
            aria-current={path === "/docs" ? "page" : undefined}
            onClick={() => setMenu(false)}
          >
            Documentation
          </Link>
          <Link
            href="/dashboard"
            aria-current={path === "/dashboard" ? "page" : undefined}
            onClick={() => setMenu(false)}
          >
            Workspace <ArrowUpRight size={14} />
          </Link>
          <button
            className="theme-button quiet"
            onClick={toggleTheme}
            aria-label="Toggle light or dark theme"
          >
            <Sun className="sun" size={17} />
            <Moon className="moon" size={17} />
          </button>
          <Link
            className="button small"
            href="/auth"
            onClick={() => setMenu(false)}
          >
            Connect GitHub <ArrowUpRight size={14} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <Link href="/" className="footer-brand">
        vathavaran.
      </Link>
      <p>Less setup. More shipping.</p>
      <div>
        <Link href="/docs">Docs</Link>
        <a
          href="https://github.com/wrestle-R/Vathavaran-Variables"
          target="_blank"
          rel="noreferrer"
        >
          GitHub <ArrowUpRight size={13} />
        </a>
      </div>
    </footer>
  );
}
