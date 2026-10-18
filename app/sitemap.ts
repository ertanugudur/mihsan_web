import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Tek sayfalık site: bölümler (#urunler, #oluk…) aynı adreste olduğu için ayrıca listelenmez.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${site.url}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
