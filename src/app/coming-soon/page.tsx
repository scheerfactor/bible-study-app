import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Check,
  Clock3,
  Handshake,
  LibraryBig,
  MessageSquareText,
  Presentation,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import LaunchCountdown from "./LaunchCountdown";

const DEFAULT_PUBLIC_BETA_TARGET = "2027-04-15T19:00:00-04:00";
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
    `Father's Business Bible Study is being prepared for a founding free public beta targeted for ${PUBLIC_BETA_TARGET_LABEL}.`,
};

const workflow = [
  ["Read", "Stay anchored in the exact KJV passage and its chapter context."],
  ["Understand", "Use quick Webster 1828, Strong's, cross-reference, and commentary study."],
  ["Obey", "Capture prayer, application, memory work, and the next faithful action."],
  ["Teach", "Carry the passage into a lesson, sermon outline, or presentation."],
] as const;

const workingPreview = [
  {
    title: "Read the KJV",
    description: "Open the Bible reader at John 3 and try passage navigation, Word Lens, and focused reading.",
    href: "/#bible",
    action: "Open Bible",
    icon: BookOpenText,
  },
  {
    title: "Browse the library",
    description: "Find reviewed public-domain books with source, rights, reading, and listening details.",
    href: "/#library",
    action: "Open Library",
    icon: LibraryBig,
  },
  {
    title: "Build a listening session",
    description: "Combine KJV Scripture, hymns, sermons, and study audio in one listening workspace.",
    href: "/#radio",
    action: "Open Radio",
    icon: RadioTower,
  },
  {
    title: "Prepare to teach",
    description: "Turn Scripture, quotes, hymns, images, and sermon notes into a presentation-ready plan.",
    href: "/#presentations",
    action: "Open Presentations",
    icon: Presentation,
  },
] as const;

const betaScope = [
  "KJV Bible reader with fast passage navigation",
  "One-tap Word Lens with reviewed source labels",
  "TSK cross-references and Bible-linked commentary",
  "Local notes, bookmarks, export, and beta teaching tools",
  "A reviewed public-domain library with rights evidence",
] as const;

const laterVision = [
  "Modern books only after written author or publisher permission",
  "Hosted sermons, audio, video, and radio only after rights and delivery testing",
  "Paid plans or a storefront only after support, backups, and repeat use are proven",
  "Broader ministry tools released in small, labeled stages instead of promised all at once",
] as const;

const partnerPath = [
  "Begin with an official resource listing or purchase link.",
  "Agree in writing on text, excerpts, images, audio, video, sales, and payment scope.",
  "Let the author or ministry review attribution and presentation before release.",
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
          <Link href="#working-preview">Try it now</Link>
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
          <p className="launch-eyebrow">Founding free public beta</p>
          <h1>Father&apos;s Business Bible Study</h1>
          <p className="launch-intro">
            Follow one KJV passage from careful reading to word study, trusted sources,
            personal obedience, and faithful teaching without losing your place.
          </p>
          <div className="launch-target-line">
            <Clock3 aria-hidden="true" size={18} />
            <span>Founding beta target: {PUBLIC_BETA_TARGET_LABEL}</span>
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
            This is a prayerful working target, not a promise that overrides readiness. Public access opens only after the release checklist passes.
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

      <section className="launch-preview" id="working-preview" aria-labelledby="working-preview-title">
        <div className="launch-section-inner">
          <div className="launch-preview-heading">
            <div>
              <p className="launch-section-label">Available in the working preview</p>
              <h2 id="working-preview-title">Start with a real study task.</h2>
            </div>
            <p>
              These links open features that are already working in the current beta. Saved work remains on this
              browser while signed out.
            </p>
          </div>
          <div className="launch-preview-grid">
            {workingPreview.map(({ title, description, href, action, icon: Icon }) => (
              <Link href={href} key={title}>
                <Icon aria-hidden="true" size={24} />
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
                <span className="launch-preview-action">
                  {action} <ArrowRight aria-hidden="true" size={17} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="launch-path" id="launch-path" aria-labelledby="launch-path-title">
        <div className="launch-section-inner launch-path-layout">
          <div>
            <p className="launch-section-label">Founding beta promise</p>
            <h2 id="launch-path-title">Useful on day one. Honest about what comes later.</h2>
            <p className="launch-section-copy">
              The founding beta stays focused on dependable study workflows and verified sources. It does not
              claim to replace every Bible program or include modern books that have not been licensed.
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

      <section className="launch-roadmap" aria-labelledby="launch-roadmap-title">
        <div className="launch-section-inner launch-roadmap-layout">
          <div>
            <p className="launch-section-label">Earned after beta</p>
            <h2 id="launch-roadmap-title">Future value must be proven and permitted.</h2>
            <ul className="launch-roadmap-list">
              {laterVision.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="launch-partner-path">
            <Handshake aria-hidden="true" size={28} />
            <p className="launch-section-label">Authors and ministries</p>
            <h2>Begin with trust, clarity, and written permission.</h2>
            <ol>
              {partnerPath.map((item, index) => (
                <li key={item}>
                  <span>{index + 1}</span>
                  <p>{item}</p>
                </li>
              ))}
            </ol>
            <Link className="launch-roadmap-action" href="/feedback">
              Discuss a resource partnership <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
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
