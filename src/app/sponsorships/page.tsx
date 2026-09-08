import type { Metadata } from "next";
import Link from "next/link";
import { EyeOff, Handshake, ShieldCheck } from "lucide-react";
import PublicInfoPage from "@/components/PublicInfoPage";

const sponsorInterestHref =
  "/feedback?category=Curated%20sponsor%20interest&context=Privacy-respecting%20public-site%20sponsorship";

export const metadata: Metadata = {
  title: "Carefully Selected Sponsors",
  description:
    "The privacy, placement, review, and stewardship rules for possible Father's Business Bible Study sponsors.",
  alternates: { canonical: "/sponsorships" },
};

export default function SponsorshipsPage() {
  return (
    <PublicInfoPage
      eyebrow="Privacy-respecting stewardship"
      title="Sponsorship without selling the study experience."
      intro="A small number of carefully reviewed businesses or ministries may eventually help fund the work. The first rule is simple: Scripture and the tools used to study, pray, prepare, teach, and preach will not become advertising space."
    >
      <section>
        <h2>What careful sponsorship means</h2>
        <ul>
          <li><strong>Direct and reviewed:</strong> no automated ad exchange or unknown advertiser.</li>
          <li><strong>Clearly labeled:</strong> paid placement must say Sponsor or Ministry sponsor.</li>
          <li><strong>Limited:</strong> the first pilot allows no more than three active sponsors.</li>
          <li><strong>Separate from review:</strong> a sponsor cannot purchase doctrinal approval, search position, or a favorable resource rating.</li>
        </ul>
      </section>

      <section>
        <h2>Where sponsorship will not appear</h2>
        <ul className="support-guardrails">
          <li><ShieldCheck aria-hidden="true" size={17} />KJV Bible reading, Word Lens, Webster 1828, Strong&apos;s, cross-references, and commentary.</li>
          <li><ShieldCheck aria-hidden="true" size={17} />Prayer, journal, sermon, Sunday School lesson, and presentation workspaces.</li>
          <li><ShieldCheck aria-hidden="true" size={17} />Audio, video, radio, projector views, and material prepared for children.</li>
          <li><EyeOff aria-hidden="true" size={17} />No behavioral targeting, tracking pixels, data brokerage, or access to private user activity.</li>
        </ul>
      </section>

      <section>
        <h2>Possible public placements</h2>
        <p>
          A future pilot may use one clearly separated acknowledgment on launch updates, support and stewardship,
          partnership information, or a public sponsor page. It will not interrupt reading or teaching.
        </p>
      </section>

      <section>
        <h2>Interest only, not an ad sale</h2>
        <p>
          The sponsorship pilot remains closed until agreements, disclosures, accounting, privacy review, complaint
          handling, and mobile presentation are tested. Recording interest does not approve a sponsor or reserve a
          placement.
        </p>
        <div className="public-info-actions">
          <Link href={sponsorInterestHref}><Handshake aria-hidden="true" size={17} />Record sponsor interest</Link>
          <Link href="/doctrine">Read the doctrinal basis</Link>
          <Link href="/support-the-work">Review the stewardship plan</Link>
        </div>
        <p className="funding-disclaimer">No sponsorship payment is collected through this page.</p>
      </section>
    </PublicInfoPage>
  );
}
