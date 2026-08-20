const FALLBACK_PUBLIC_SITE_URL = "https://bible-study-app-eight.vercel.app";

function resolvePublicSiteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_PUBLIC_SITE_URL);
  } catch {
    return new URL(FALLBACK_PUBLIC_SITE_URL);
  }
}

export const publicSiteUrl = resolvePublicSiteUrl();
export const siteName = "Father's Business Bible Study";
export const siteDescription =
  "KJV-first Bible reading, trusted study tools, reviewed public-domain books, and connected teaching preparation.";
export const socialPreviewImage = {
  url: "/launch/bible-study-desk-hero.jpg",
  width: 1672,
  height: 941,
  alt: "An open Bible, study notes, maps, and reference books arranged on a study desk",
};
