import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoPage from "@/components/PublicInfoPage";

export const metadata: Metadata = {
  title: "Why This Bible Study App",
  description: "An honest comparison of the Father's Business study-to-teach workflow with established Bible software.",
  alternates: { canonical: "/why" },
};

const comparisonRows = [
  ["Primary strength", "Deep licensed library and professional guides", "Free, familiar desktop and mobile study", "Fast KJV-centered search and deep referencing", "A connected KJV study-to-teach path"],
  ["Word help", "Original-language guides and contextual tools", "Strong's tooltips and searches", "Strong's links, StudyClick, and English-Strong's Indexer", "Reviewed Webster 1828 and Strong's together in Word Lens"],
  ["Passage resources", "Passage Guide and linked library", "Bibles, dictionaries, commentaries, and reference modules", "Verse Guide across the installed library", "TSK, labeled commentary, books, media, notes, and teaching tools linked to the passage"],
  ["Writing and teaching", "Notes, workflows, and Sermon Builder", "Built-in editor for sermons and studies", "Personal books, commentaries, and sermon writing", "Observation, doctrine, application, prayer, obedience, lesson, sermon, and presentation in one path"],
  ["Current advantage", "Catalog depth, scholarship, and mature platform", "Long-established value and broad availability", "Speed, private local search, and KJV-focused discovery", "Source transparency, ministry follow-through, and browser access across phone, tablet, and desktop"],
  ["Current limitation", "Can require time, training, and paid resources", "Separate platform apps and module choices", "Windows-only desktop product", "Smaller beta catalog; offline use, marketplace, and remote presentation still being proven"],
] as const;

export default function WhyPage() {
  return (
    <PublicInfoPage
      eyebrow="An honest comparison"
      title="Why add Father&apos;s Business?"
      intro="Established Bible programs have earned trust through mature libraries, search, study guides, and personal notes. This app should not pretend those strengths do not exist. Its reason for being is a simpler KJV-first path from a passage to understanding, obedience, and faithful teaching."
    >
      <section>
        <h2>The difference</h2>
        <div>
          <p><strong>Read. Understand. Obey. Teach.</strong></p>
          <p>
            The app keeps the passage central while word study, cross-references, commentary, notes, prayer,
            lesson preparation, sermon writing, and presentation become stages of one task instead of separate destinations.
          </p>
        </div>
      </section>

      <section className="comparison-section">
        <h2>Feature perspective</h2>
        <div className="comparison-scroll" tabIndex={0}>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Logos</th>
                <th>e-Sword</th>
                <th>SwordSearcher</th>
                <th>Father&apos;s Business</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([area, logos, eSword, swordSearcher, fathersBusiness]) => (
                <tr key={area}>
                  <th>{area}</th>
                  <td>{logos}</td>
                  <td>{eSword}</td>
                  <td>{swordSearcher}</td>
                  <td>{fathersBusiness}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Use it beside what already works</h2>
        <div>
          <p>
            A serious student may keep Logos for a licensed research library, e-Sword for familiar modules, or
            SwordSearcher for fast local KJV study. Father&apos;s Business earns a place when it makes the journey from
            research to prayer, obedience, lesson, sermon, and presentation clearer and faster.
          </p>
        </div>
      </section>

      <section>
        <h2>Sources checked</h2>
        <div>
          <p>Comparison reviewed August 23, 2026 from official product descriptions. Features and terms can change.</p>
          <ul>
            <li><a href="https://www.logos.com/configure/subscriptions">Logos subscriptions and features</a></li>
            <li><a href="https://www.e-sword.net/">e-Sword official feature overview</a></li>
            <li><a href="https://www.swordsearcher.com/features.html">SwordSearcher official features</a></li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Try the proof</h2>
        <div className="public-info-actions">
          <Link href="/#bible">Open the KJV reader</Link>
          <Link href="/#presentations">Open teaching presentations</Link>
          <Link href="/coming-soon">Review the launch plan</Link>
        </div>
      </section>
    </PublicInfoPage>
  );
}
