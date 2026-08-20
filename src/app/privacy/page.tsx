import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoPage from "@/components/PublicInfoPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How the Father's Business Bible Study public beta stores study work, account data, and feedback.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Effective August 19, 2026"
      title="Privacy in the public beta"
      intro="The beta is designed to work without an account. This page explains what stays in your browser, what may sync when you sign in, and what is sent when you contact us."
    >
      <section>
        <h2>When you use the app signed out</h2>
        <p>
          Notes, highlights, bookmarks, reading and listening progress, saved study sessions, memory work,
          prayer and journal entries, sermons, presentations, and preferences may be stored in this browser on
          this device. They are not account-synced while you are signed out.
        </p>
        <p>
          Clearing this site&apos;s browser data can remove that local work. Use the available export tools before
          clearing browser data or changing devices.
        </p>
      </section>

      <section>
        <h2>When you sign in</h2>
        <p>
          Supabase provides email magic-link authentication. When sync is available, the app may store your user
          identifier and supported study records, including notes, highlights, bookmarks, library progress and
          favorites, listening progress, Bible mastery, memory verses, and study playlists.
        </p>
        <p>The Settings page shows whether the app is saving locally or syncing to your account.</p>
      </section>

      <section>
        <h2>Feedback and support</h2>
        <p>
          The feedback form sends the passage or resource, selected category, your message, and an optional email
          address. If you are signed in, the private feedback record may also be connected to your account user ID.
          Do not include passwords, financial information, or other sensitive personal information.
        </p>
      </section>

      <section>
        <h2>Service providers and external links</h2>
        <p>
          Vercel hosts the website and Supabase provides authentication and database services. These providers may
          process technical request and account data needed to operate and secure their services under their own
          policies. Library and media links may open independent ministry, publisher, archive, or bookstore sites.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You may use the beta signed out, omit the optional feedback email, export supported study data, and clear
          local browser data. For account, cloud-data, or privacy requests, use the <Link href="/support">support page</Link>.
        </p>
      </section>
    </PublicInfoPage>
  );
}
