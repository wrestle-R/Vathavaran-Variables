"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, Menu, Search, X } from "lucide-react";
type Entry = {
  slug: string;
  title: string;
  group: string;
  description: string;
  headings: string[];
  searchText: string;
};
const href = (slug: string) => (slug ? `/docs/${slug}` : "/docs");
export function DocsNavigation({
  entries,
  active,
}: {
  entries: Entry[];
  active: string;
}) {
  const [expanded, setExpanded] = useState(false),
    [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    input = useRef<HTMLInputElement>(null);
  const groups = Array.from(new Set(entries.map((entry) => entry.group)));
  function search() {
    dialog.current?.showModal();
    input.current?.focus();
  }
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        dialog.current?.showModal();
        input.current?.focus();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const searchQuery = query.trim().toLowerCase();
  const results = entries.filter((entry) =>
    `${entry.title} ${entry.description} ${entry.headings.join(" ")} ${entry.searchText}`
      .toLowerCase()
      .includes(searchQuery),
  );
  return (
    <>
      <aside className="documentation-sidebar">
        <div className="docs-sidebar-top">
          <Link href="/docs" className="docs-wordmark">
            <BookOpen size={17} /> Documentation <span>v2</span>
          </Link>
          <button
            className="quiet docs-mobile-toggle"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label="Toggle documentation navigation"
          >
            <Menu size={18} />
          </button>
        </div>
        <button className="docs-search" onClick={search}>
          <Search size={15} />
          <span>Search the docs</span>
          <kbd>⌘ K</kbd>
        </button>
        <nav
          aria-label="Documentation"
          className={expanded ? "docs-sections expanded" : "docs-sections"}
        >
          {groups.map((group) => (
            <div className="docs-nav-group" key={group}>
              <p>{group}</p>
              {entries
                .filter((entry) => entry.group === group)
                .map((entry) => (
                  <Link
                    key={entry.slug}
                    href={href(entry.slug)}
                    aria-current={entry.slug === active ? "page" : undefined}
                    onClick={() => setExpanded(false)}
                  >
                    {entry.title}
                  </Link>
                ))}
            </div>
          ))}
          <a
            className="docs-repo-link"
            href="https://github.com/wrestle-R/Vathavaran-Variables"
            target="_blank"
            rel="noreferrer"
          >
            View source <ArrowUpRight size={13} />
          </a>
        </nav>
      </aside>
      <dialog
        className="docs-search-dialog"
        aria-label="Search the documentation"
        ref={dialog}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="search-dialog-header">
          <Search size={19} />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, guides, configuration…"
            aria-label="Search documentation"
          />
          <button
            className="quiet"
            onClick={() => dialog.current?.close()}
            aria-label="Close search"
          >
            <X size={19} />
          </button>
        </div>
        <div className="search-results">
          {results.map((entry) => (
            <Link
              key={entry.slug}
              href={href(entry.slug)}
              onClick={() => {
                dialog.current?.close();
                setExpanded(false);
              }}
            >
              <span>{entry.group}</span>
              <strong>{entry.title}</strong>
              <p>{entry.description}</p>
              <ArrowUpRight size={17} />
            </Link>
          ))}
          {!results.length && (
            <p className="no-results">
              No results for “{query}”. Try a command or configuration name.
            </p>
          )}
        </div>
        <div className="search-dialog-footer">
          <span role="status" aria-live="polite">
            {results.length} {results.length === 1 ? "page" : "pages"}
            {searchQuery ? " found" : " to explore"}
          </span>
          <kbd>Esc to close</kbd>
        </div>
      </dialog>
    </>
  );
}
export function OnThisPage({
  sections,
}: {
  sections: { id: string; title: string }[];
}) {
  const [active, setActive] = useState(sections[0]?.id);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-100px 0px -65% 0px", threshold: 0 },
    );
    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [sections]);
  return (
    <aside className="docs-toc">
      <p>On this page</p>
      <nav aria-label="On this page">
        {sections.map((section) => (
          <a
            href={`#${section.id}`}
            key={section.id}
            aria-current={active === section.id ? "location" : undefined}
          >
            {section.title}
          </a>
        ))}
      </nav>
      <div className="docs-help">
        <p>Working in your terminal?</p>
        <Link href="/docs/quickstart">
          Start with the quickstart <ArrowUpRight size={12} />
        </Link>
      </div>
    </aside>
  );
}
