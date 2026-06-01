import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Father's Business Bible Study",
  description: "A mobile-first KJV Bible reader with search, notes, highlights, bookmarks, and Webster's 1828 lookup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
