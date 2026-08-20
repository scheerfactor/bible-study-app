import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoPage from "@/components/PublicInfoPage";

export const metadata: Metadata = {
  title: "Beta Terms",
  description: "Plain-language terms for using the Father's Business Bible Study public beta.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Founding public beta"
      title="Terms for using the beta"
      intro="The beta is offered for Bible reading, personal study, teaching preparation, and constructive testing. Features and content may change as errors are corrected and permissions are clarified."
    >
      <section>
        <h2>Beta availability</h2>
        <p>
          The service may be changed, limited, interrupted, or withdrawn while stability, backups, account sync,
          and support processes are being proven. Keep independent copies of important notes, sermons, lessons,
          journals, prayer records, and presentations.
        </p>
      </section>

      <section>
        <h2>Responsible use</h2>
        <p>
          Do not misuse the service, attempt unauthorized access, interfere with other users, upload malicious
          material, or use the app to distribute material you do not have permission to use. You remain responsible
          for what you write, upload, export, present, or share.
        </p>
      </section>

      <section>
        <h2>Bible study resources</h2>
        <p>
          Historical books, commentaries, dictionaries, maps, audio, images, and external links are study aids.
          Source, edition, review, and rights information may vary by resource. Read the Bible text in context and
          verify important teaching before relying on any secondary source.
        </p>
      </section>

      <section>
        <h2>Accounts and saved work</h2>
        <p>
          Signed-out work may exist only in local browser storage. Signed-in synchronization covers only supported
          data types and should not be treated as a complete archival backup. You are responsible for keeping
          exports or other copies of material you cannot afford to lose.
        </p>
      </section>

      <section>
        <h2>External services and links</h2>
        <p>
          Links to ministries, publishers, archives, stores, audio hosts, and other websites are provided for
          discovery. Their content, availability, purchases, permissions, and policies are controlled by those
          organizations, not by this beta.
        </p>
      </section>

      <section>
        <h2>Corrections and questions</h2>
        <p>
          Report text, attribution, source, rights, or functional concerns through <Link href="/feedback">beta feedback</Link>.
          Continued use after a clearly posted terms update means you accept the updated beta terms.
        </p>
      </section>
    </PublicInfoPage>
  );
}
