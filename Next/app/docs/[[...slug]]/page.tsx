import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Info } from "lucide-react";
import { documentation, docHref } from "@/lib/documentation";
import { DocsNavigation, OnThisPage } from "@/components/docs-navigation";
import { DocsCode } from "@/components/docs-code";
type Props = { params: Promise<{ slug?: string[] }> };
export function generateStaticParams() {
  return documentation.map((page) => ({
    slug: page.slug ? page.slug.split("/") : [],
  }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = documentation.find(
    (page) => page.slug === (slug || []).join("/"),
  );
  return {
    title: page ? `${page.title} · Docs` : "Documentation",
    description: page?.description,
  };
}
export default async function DocumentationPage({ params }: Props) {
  const { slug } = await params;
  const path = (slug || []).join("/");
  const index = documentation.findIndex((page) => page.slug === path);
  if (index < 0) notFound();
  const page = documentation[index];
  const previous = documentation[index - 1],
    next = documentation[index + 1];
  const entries = documentation.map((page) => ({
    slug: page.slug,
    title: page.title,
    description: page.description,
    group: page.group,
    headings: page.sections.map((section) => section.title),
    searchText: page.sections.map(section => [...(section.paragraphs || []), ...(section.steps || []), ...(section.code?.map(code => code.value) || []), ...(section.table?.rows.flat() || []), section.note?.text || ""].join(" ")).join(" "),
  }));
  return (
    <div className="documentation-layout">
      <DocsNavigation entries={entries} active={path} />
      <article className="documentation-article">
        <div className="docs-breadcrumb">
          <Link href="/docs">Docs</Link>
          <ChevronRight size={12} />
          <span>{page.group}</span>
          <ChevronRight size={12} />
          <span>{page.title}</span>
        </div>
        <header className="docs-article-header">
          <p className="eyebrow">{page.group}</p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </header>
        {page.sections.map((section) => (
          <section className="doc-section" id={section.id} key={section.id}>
            <h2>
              <a href={`#${section.id}`}>
                {section.title}
                <span aria-hidden="true">#</span>
              </a>
            </h2>
            {section.paragraphs?.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            {section.steps && (
              <ol className="docs-steps">
                {section.steps.map((step, index) => (
                  <li key={index}>
                    <span aria-hidden="true">{index + 1}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            )}
            {section.table && (
              <div className="docs-table-scroll">
                <table className="docs-table">
                  <thead>
                    <tr>
                      {section.table.headers.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, index) => (
                      <tr key={index}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>
                            {cellIndex === 0 ? <code>{cell}</code> : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {section.code && <DocsCode samples={section.code} />}{" "}
            {section.note && (
              <aside className="docs-callout">
                <Info size={17} />
                <div>
                  <strong>{section.note.title}</strong>
                  <p>{section.note.text}</p>
                </div>
              </aside>
            )}
          </section>
        ))}
        <nav
          className="docs-pagination"
          aria-label="Adjacent documentation pages"
        >
          {previous ? (
            <Link href={docHref(previous.slug)}>
              <span>
                <ArrowLeft size={12} /> Previous
              </span>
              <strong>{previous.title}</strong>
            </Link>
          ) : (
            <div />
          )}
          {next && (
            <Link href={docHref(next.slug)}>
              <span>
                Next <ArrowRight size={12} />
              </span>
              <strong>{next.title}</strong>
            </Link>
          )}
        </nav>
        <p className="docs-endnote">
          Vathavaran v2 · Documentation follows the current repository
          implementation.
        </p>
      </article>
      <OnThisPage
        sections={page.sections.map(({ id, title }) => ({ id, title }))}
      />
    </div>
  );
}
