export const DEFAULT_PUBLIC_BETA_TARGET = "2027-04-15T19:00:00-04:00";

const configuredTarget = process.env.NEXT_PUBLIC_PUBLIC_BETA_TARGET_AT ?? DEFAULT_PUBLIC_BETA_TARGET;

export const publicBetaTarget = Number.isNaN(Date.parse(configuredTarget))
  ? DEFAULT_PUBLIC_BETA_TARGET
  : configuredTarget;

export const publicBetaTargetLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
  timeZoneName: "short",
}).format(new Date(publicBetaTarget));

export const foundingFundTargetUsd = 50_000;

function configuredRaisedAmount() {
  const parsed = Number(process.env.NEXT_PUBLIC_FOUNDING_FUND_RAISED_USD ?? "0");
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(foundingFundTargetUsd, Math.max(0, Math.round(parsed)));
}

export const foundingFundRaisedUsd = configuredRaisedAmount();

export const foundingFundBudget = [
  { label: "Engineering, testing, and accessibility", amount: 15_000 },
  { label: "Content review, permissions, and rights records", amount: 10_000 },
  { label: "Hosting, storage, email, monitoring, and backups", amount: 7_500 },
  { label: "Legal, accounting, insurance, and payment readiness", amount: 7_500 },
  { label: "Launch media, documentation, and beta support", amount: 5_000 },
  { label: "Reliability and operating reserve", amount: 5_000 },
] as const;
