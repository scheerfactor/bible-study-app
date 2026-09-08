import type { Metadata } from "next";
import Link from "next/link";
import { Check, CircleDollarSign, Handshake, ShieldCheck } from "lucide-react";
import PublicInfoPage from "@/components/PublicInfoPage";
import {
  foundingFundBudget,
  foundingFundRaisedUsd,
  foundingFundTargetUsd,
} from "@/lib/launch-plan";

export const metadata: Metadata = {
  title: "Support The Work",
  description: "The founding-beta funding target, stewardship plan, safeguards, and supporter-interest path.",
  alternates: { canonical: "/support-the-work" },
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const progress = Math.round((foundingFundRaisedUsd / foundingFundTargetUsd) * 100);
const supporterHref = "/feedback?category=Founding%20supporter%20interest&context=Funding%20and%20stewardship";

export default function SupportTheWorkPage() {
  return (
    <PublicInfoPage
      eyebrow="Founding-beta stewardship"
      title="Help build something dependable."
      intro="The first funding goal is a practical one-year runway for careful engineering, verified content, rights administration, support, and responsible operations. It is not a promise to buy an enormous catalog or release unfinished features."
    >
      <section>
        <h2>Founding target</h2>
        <div className="funding-summary">
          <div className="funding-total-line">
            <strong>{currency.format(foundingFundRaisedUsd)}</strong>
            <span>of {currency.format(foundingFundTargetUsd)}</span>
          </div>
          <div
            aria-label={`${progress}% of the founding-beta funding target recorded`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="funding-progress"
            role="progressbar"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>{progress}% recorded. Updated from verified contribution records, not pledges or verbal commitments.</p>
        </div>
      </section>

      <section>
        <h2>What $50,000 funds</h2>
        <div className="funding-budget">
          {foundingFundBudget.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{currency.format(item.amount)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Support is not payment for Scripture</h2>
        <ul className="support-guardrails">
          <li><Check aria-hidden="true" size={17} />KJV reading and the reviewed public-domain core remain free.</li>
          <li><Check aria-hidden="true" size={17} />Beta invitations are based on testing capacity, not gift size.</li>
          <li><Check aria-hidden="true" size={17} />No copyrighted book or media is promised before written permission.</li>
          <li><Check aria-hidden="true" size={17} />No gift is described as tax-deductible without a confirmed legal basis.</li>
        </ul>
      </section>

      <section>
        <h2>Thank-you plan</h2>
        <div>
          <p>
            Supporters may receive the same monthly build-and-stewardship report, quarterly demonstration invitation,
            and an optional name on a thank-you page. These acknowledgments do not unlock Scripture, beta priority,
            or third-party books.
          </p>
        </div>
      </section>

      <section>
        <h2>Payment opening gate</h2>
        <div>
          <p>
            Online payments remain closed until accounting categories, processor access, receipts, refunds, privacy,
            security monitoring, and a withdrawal/reconciliation procedure are tested.
          </p>
          <div className="public-info-actions">
            <Link href={supporterHref}><CircleDollarSign aria-hidden="true" size={17} />Record supporter interest</Link>
            <Link href="/rights"><ShieldCheck aria-hidden="true" size={17} />Review content-rights safeguards</Link>
          </div>
          <p className="funding-disclaimer">No payment is collected through either link.</p>
        </div>
      </section>

      <section>
        <h2>Carefully selected sponsors</h2>
        <div>
          <p>
            A future direct-sponsorship pilot may help support operations without putting ads inside Scripture,
            study, prayer, sermons, lessons, or presentations. No automated ad network, behavioral targeting, or
            sale of user data is planned.
          </p>
          <div className="public-info-actions">
            <Link href="/sponsorships"><Handshake aria-hidden="true" size={17} />Review sponsorship safeguards</Link>
          </div>
        </div>
      </section>
    </PublicInfoPage>
  );
}
