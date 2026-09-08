const FALLBACK_PUBLIC_SITE_URL = "https://study.fathersbusinessmasteryresources.com";

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
export const brandMark = "/brand/fathers-business-bible-study-mark.png";
export const socialPreviewImage = {
  url: "/launch/bible-study-desk-hero.jpg",
  width: 1672,
  height: 941,
  alt: "An open Bible, study notes, maps, and reference books arranged on a study desk",
};
