import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoPage from "@/components/PublicInfoPage";

const partnershipHref =
  "/feedback?category=Author%20%2F%20publisher%20partnership&context=Founding%20author%20invitation";

export const metadata: Metadata = {
  title: "Authors and Ministry Partners",
  description:
    "How authors, publishers, and ministries can explore a carefully scoped partnership with Father's Business Bible Study.",
  alternates: { canonical: "/partners" },
};

export default function PartnersPage() {
  return (
    <PublicInfoPage
      eyebrow="Founding author and ministry partnerships"
      title="Help serious Bible students find trusted work."
      intro="Father's Business Bible Study is building a KJV-centered, conservative Baptist-friendly study path where Scripture remains primary and every supporting resource carries visible source, rights, and review information."
    >
      <section>
        <h2>Why this library is different</h2>
        <ul>
          <li><strong>Scripture first:</strong> books and media support the KJV passage instead of replacing it.</li>
          <li><strong>Human review:</strong> publication decisions are made by people against a written doctrinal and content-review basis.</li>
          <li><strong>Visible context:</strong> author, date, source, rights status, historical perspective, and cautions travel with the resource.</li>
          <li><strong>No silent endorsement:</strong> inclusion of a historical work does not mean every conclusion in it is endorsed.</li>
        </ul>
      </section>

      <section>
        <h2>Begin with one useful step</h2>
        <ol>
          <li>List one selected title with accurate metadata and an official ministry or purchase link.</li>
          <li>Add an approved description, cover, excerpt, sample chapter, sermon, lesson, or media link only within written scope.</li>
          <li>Let the author, publisher, or ministry review attribution and presentation before public release.</li>
          <li>Discuss full text, audio, video, classroom use, paid access, affiliate links, or resale as separate later agreements.</li>
        </ol>
      </section>

      <section>
        <h2>Your work stays yours</h2>
        <p>
          A conversation does not grant publication rights. Unapproved copyrighted material stays out of the public
          library. Written permission records the exact title, formats, uses, attribution, audience, term, payment,
          reporting, and removal rules that apply.
        </p>
        <p>
          We do not assume that permission for a book also covers its cover art, audiobook, sermon recording,
          transcript, presentation export, text-to-speech, or sale. Each use can be approved or declined separately.
        </p>
      </section>

      <section>
        <h2>What partners receive</h2>
        <ul>
          <li>Accurate attribution and an official author, ministry, publisher, or purchase link.</li>
          <li>Discovery beside relevant Bible passages and study workflows when that use is approved.</li>
          <li>A review opportunity before licensed material becomes public.</li>
          <li>A direct correction, restriction, and removal path for rights holders.</li>
          <li>Separate conversations about free access, paid access, referrals, royalties, and direct sales.</li>
        </ul>
      </section>

      <section>
        <h2>Explore a founding partnership</h2>
        <p>
          Authors, publishers, pastors, teachers, missionaries, evangelists, and ministry media owners may begin
          with one selected resource and a narrow request. There is no expectation of broad catalog permission.
        </p>
        <div className="public-info-actions">
          <Link href={partnershipHref}>Start a partnership conversation</Link>
          <a href="mailto:hello@fathersbusinessmasteryresources.com">
            Email hello@fathersbusinessmasteryresources.com
          </a>
          <Link href="/rights">Read the content-rights policy</Link>
        </div>
      </section>
    </PublicInfoPage>
  );
}
