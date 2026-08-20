import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoPage from "@/components/PublicInfoPage";

const supportEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL?.trim() || "hello@fathersbusinessmasteryresources.com";

const supportPaths = [
  ["Report a bug", "Bug report", "App problem"],
  ["Report a resource problem", "Resource issue", "Resource correction"],
  ["Report an audio problem", "Audio issue", "Audio playback"],
  ["Ask about an author or publisher partnership", "Author / publisher partnership", "Resource partnership"],
] as const;

function feedbackHref(category: string, context: string) {
  return `/feedback?category=${encodeURIComponent(category)}&context=${encodeURIComponent(context)}`;
}

export const metadata: Metadata = {
  title: "Support",
  description: "Public beta help, troubleshooting, feedback, and resource partnership contact paths.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <PublicInfoPage
      eyebrow="Public beta help"
      title="Support and contact"
      intro="The fastest way to improve the beta is to send one clear report with the page, passage, resource, device, and result you expected."
    >
      <section>
        <h2>Choose the closest path</h2>
        <div className="public-info-actions">
          {supportPaths.map(([label, category, context]) => (
            <Link href={feedbackHref(category, context)} key={label}>{label}</Link>
          ))}
        </div>
      </section>

      <section>
        <h2>Before reporting a problem</h2>
        <ol>
          <li>Refresh the page once and try the same action again.</li>
          <li>Check Settings to see whether the app says it is saving locally or syncing.</li>
          <li>Record the page, Bible reference or resource title, device, browser, and exact error.</li>
          <li>Export important notes before clearing browser data or testing on another device.</li>
        </ol>
      </section>

      <section>
        <h2>Account and data requests</h2>
        <p>
          Use the feedback form and include an email address for sign-in, sync, account, privacy, or cloud-data
          requests. Do not place passwords, magic-link codes, financial information, or other sensitive data in the message.
        </p>
      </section>

      <section>
        <h2>Email fallback</h2>
        <p>
          If direct feedback delivery is unavailable, the form can prepare an email to
          {" "}<a href={`mailto:${supportEmail}`}>{supportEmail}</a>. Public beta support is handled as capacity allows;
          no guaranteed response time is promised during the founding beta.
        </p>
      </section>
    </PublicInfoPage>
  );
}
