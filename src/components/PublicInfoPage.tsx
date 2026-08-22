import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpenText, ChevronLeft } from "lucide-react";

type PublicInfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

const publicLinks = [
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Content rights", "/rights"],
  ["Doctrinal basis", "/doctrine"],
  ["Author partnerships", "/partners"],
  ["Support", "/support"],
] as const;

export default function PublicInfoPage({ eyebrow, title, intro, children }: PublicInfoPageProps) {
  return (
    <main className="public-info-page">
      <header className="public-info-header">
        <Link className="public-info-brand" href="/" aria-label="Father's Business Bible Study home">
          <BookOpenText aria-hidden="true" size={23} />
          <span>
            <strong>Father&apos;s Business</strong>
            <small>Bible Study</small>
          </span>
        </Link>
        <Link className="public-info-back" href="/coming-soon">
          <ChevronLeft aria-hidden="true" size={17} />
          Launch page
        </Link>
      </header>

      <div className="public-info-main">
        <section className="public-info-lead">
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <div>{intro}</div>
        </section>

        <div className="public-info-content">{children}</div>

        <nav className="public-info-links" aria-label="Legal and support pages">
          {publicLinks.map(([label, href]) => (
            <Link href={href} key={href}>{label}</Link>
          ))}
        </nav>
      </div>

      <footer className="public-info-footer">
        <span>Founding free public beta</span>
        <Link href="/feedback">Report a problem or correction</Link>
      </footer>
    </main>
  );
}
