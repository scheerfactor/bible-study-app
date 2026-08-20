import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoPage from "@/components/PublicInfoPage";

const rightsCorrectionHref =
  "/feedback?category=Resource%20issue&context=Content%20rights%20or%20source%20correction";

export const metadata: Metadata = {
  title: "Content Rights",
  description: "How sources, public-domain evidence, permissions, and external resource links are handled.",
  alternates: { canonical: "/rights" },
};

export default function RightsPage() {
  return (
    <PublicInfoPage
      eyebrow="Source-first publishing"
      title="Content rights and attribution"
      intro="A useful Bible library must also be a trustworthy one. Resources are published only within documented public-domain, permission, license, or link-only boundaries."
    >
      <section>
        <h2>What the labels mean</h2>
        <ul>
          <li><strong>Public domain:</strong> the work, source edition, and digital-use evidence have been reviewed for the stated use.</li>
          <li><strong>Permission granted:</strong> written permission controls exactly what may be linked, quoted, displayed, hosted, narrated, or sold.</li>
          <li><strong>Official link only:</strong> the app points to the rights holder or authorized host without copying the protected work.</li>
          <li><strong>Needs review or permission needed:</strong> the resource must remain out of the public library until the open question is resolved.</li>
        </ul>
      </section>

      <section>
        <h2>Source and edition matter</h2>
        <p>
          An old author&apos;s original work may be public domain while a modern edition, translation, introduction,
          transcription, recording, cover, photograph, or database remains protected. Age alone is not treated as
          sufficient evidence.
        </p>
      </section>

      <section>
        <h2>Current foundation</h2>
        <p>
          The KJV reader uses the public-domain text identified by the <code>es-kjv</code> source. Webster 1828,
          Strong&apos;s, TSK-style cross references, historical commentaries, books, hymns, maps, images, and media
          are admitted through separate source manifests and review checks. Project Gutenberg material retains its
          applicable license and trademark considerations.
        </p>
      </section>

      <section>
        <h2>Modern authors and ministries</h2>
        <p>
          Modern books, excerpts, covers, sermons, audio, video, transcripts, and generated narration are not
          assumed to be available. Written scope must address attribution, storage, editing, narration, paid access,
          sales, territories, reporting, and withdrawal where those uses apply.
        </p>
      </section>

      <section>
        <h2>Report a concern</h2>
        <p>
          Rights holders and readers may <Link href={rightsCorrectionHref}>report a source or rights concern</Link>.
          Include the resource title, author, exact page or screen, and the correction requested. A disputed item may
          be restricted while the evidence is reviewed.
        </p>
      </section>
    </PublicInfoPage>
  );
}
