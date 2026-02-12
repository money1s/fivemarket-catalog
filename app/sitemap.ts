import { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/products";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = ["", "/sadzhantsi", "/nasinnia", "/cart", "/checkout", "/thanks"].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
  }));

  const productPages: MetadataRoute.Sitemap = getActiveProducts().map((product) => ({
    url: `${baseUrl}/p/${product.slug}`,
    lastModified: now,
  }));

  return [...staticPages, ...productPages];
}
