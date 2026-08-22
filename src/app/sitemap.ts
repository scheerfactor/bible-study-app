import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", publicSiteUrl).toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/coming-soon", publicSiteUrl).toString(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: new URL("/feedback", publicSiteUrl).toString(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...["privacy", "terms", "rights", "doctrine", "partners", "support"].map((path) => ({
      url: new URL(`/${path}`, publicSiteUrl).toString(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
