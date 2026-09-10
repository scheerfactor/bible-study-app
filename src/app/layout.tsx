import type { Metadata, Viewport } from "next";
import { publicSiteUrl, siteDescription, siteName, socialPreviewImage } from "@/lib/site-metadata";
import "./globals.css";
import OfflineStudy from "@/components/OfflineStudy";

export const metadata: Metadata = {
  metadataBase: publicSiteUrl,
  applicationName: siteName,
  appleWebApp: { capable: true, title: "Bible Study", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: siteName,
    description: siteDescription,
    images: [socialPreviewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [socialPreviewImage.url],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#203e30",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><OfflineStudy />{children}</body>
    </html>
  );
}
