import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenText, Check, Clock3, MessageSquareText, ShieldCheck } from "lucide-react";
import LaunchCountdown from "./LaunchCountdown";

const DEFAULT_PUBLIC_BETA_TARGET = "2026-10-15T19:00:00-04:00";
const configuredTarget = process.env.NEXT_PUBLIC_PUBLIC_BETA_TARGET_AT ?? DEFAULT_PUBLIC_BETA_TARGET;
const PUBLIC_BETA_TARGET = Number.isNaN(Date.parse(configuredTarget))
  ? DEFAULT_PUBLIC_BETA_TARGET
  : configuredTarget;
const PUBLIC_BETA_TARGET_LABEL = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
  timeZoneName: "short",
}).format(new Date(PUBLIC_BETA_TARGET));

export const metadata: Metadata = {
  title: "Coming Soon | Father's Business Bible Study",
  description:
    `Father's Business Bible Study is being prepared for a limited free public beta targeted for ${PUBLIC_BETA_TARGET_LABEL}.`,
};

const workflow = [
  ["Read", "Stay anchored in the exact KJV passage and its chapter context."],
  ["Understand", "Use quick Webster 1828, Strong's, cross-reference, and commentary study."],
  ["Obey", "Capture prayer, application, memory work, and the next faithful action."],
  ["Teach", "Carry the passage into a lesson, sermon outline, or presentation."],
] as const;

const betaScope = [
  "KJV Bible reader with fast passage navigation",
  "One-tap Word Lens with reviewed source labels",
  "TSK cross-references and Bible-linked commentary",
  "Notes, lessons, sermons, hymns, and presentations",
  "A reviewed public-domain library with rights evidence",
] as const;

export default function ComingSoonPage() {
  return (
    <main className="launch-page">
      <header className="launch-header">
        <Link className="launch-brand" href="/" aria-label="Father's Business Bible Study home">
          <BookOpenText aria-hidden="true" size={24} />
          <span>
            <strong>Father&apos;s Business</strong>
            <small>Bible Study</small>
          </span>
        </Link>
        <nav aria-label="Launch page navigation">
          <Link href="#launch-path">Launch path</Link>
          <Link className="launch-header-action" href="/">Open preview</Link>
        </nav>
      </header>

      <section className="launch-hero">
        <Image
          alt="An open Bible, study notes, maps, and reference books arranged on a study desk"
          className="launch-hero-image"
          fill
          priority
          sizes="100vw"
          src="/launch/bible-study-desk-hero.jpg"
        />
        <div className="launch-hero-shade" />
        <div className="launch-hero-content">
          <p className="launch-eyebrow">Limited free public beta</p>
          <h1>Father&apos;s Business Bible Study</h1>
          <p className="launch-intro">
            Follow one KJV passage from careful reading to word study, trusted sources,
            personal obedience, and faithful teaching without losing your place.
          </p>
          <div className="launch-target-line">
            <Clock3 aria-hidden="true" size={18} />
            <span>Target: {PUBLIC_BETA_TARGET_LABEL}</span>
          </div>
          <LaunchCountdown target={PUBLIC_BETA_TARGET} />
          <div className="launch-actions">
            <Link className="launch-primary-action" href="/">
              Open current preview <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link className="launch-secondary-action" href="/feedback">
              Share beta feedback
            </Link>
          </div>
          <p className="launch-target-note">
            This is a working target. Public access opens only after the release checklist passes.
          </p>
        </div>
      </section>

      <section className="launch-workflow" aria-labelledby="launch-workflow-title">
        <div className="launch-section-inner">
          <p className="launch-section-label">One connected study path</p>
          <h2 id="launch-workflow-title">Read. Understand. Obey. Teach.</h2>
          <div className="launch-workflow-grid">
            {workflow.map(([title, description], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="launch-path" id="launch-path" aria-labelledby="launch-path-title">
        <div className="launch-section-inner launch-path-layout">
          <div>
            <p className="launch-section-label">Public beta scope</p>
            <h2 id="launch-path-title">Built for serious Bible study that leads somewhere.</h2>
            <p className="launch-section-copy">
              The first public release stays focused on dependable study workflows and verified sources.
              Paid plans and licensed books will follow only after permissions, support, backups, and account
              sync are proven.
            </p>
          </div>
          <ul className="launch-scope-list">
            {betaScope.map((item) => (
              <li key={item}>
                <Check aria-hidden="true" size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="launch-trust" aria-label="Launch commitments">
        <div className="launch-section-inner launch-trust-grid">
          <div>
            <ShieldCheck aria-hidden="true" size={26} />
            <h2>Sources and rights stay visible.</h2>
            <p>Public-domain evidence, permission scope, and review status travel with the resource.</p>
          </div>
          <div>
            <MessageSquareText aria-hidden="true" size={26} />
            <h2>Feedback shapes the release.</h2>
            <p>Problems and resource corrections are handled before the beta grows to the next group.</p>
          </div>
        </div>
      </section>

      <footer className="launch-footer">
        <div className="launch-section-inner">
          <strong>Father&apos;s Business Bible Study</strong>
          <span>KJV-first study for reading, understanding, obeying, and teaching.</span>
          <Link href="/feedback">Beta feedback</Link>
        </div>
      </footer>
    </main>
  );
}
