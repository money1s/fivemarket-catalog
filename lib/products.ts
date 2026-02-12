import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import { Product, ProductCategory } from "@/lib/types";

const CONTENT_DIR = path.join(process.cwd(), "content", "products");
const MAX_IMAGES = 5;

function parseCategory(value: unknown): ProductCategory {
  return value === "sadzhantsi" || value === "nasinnia" ? value : "nasinnia";
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return fallback;
}

function parseProductFromFile(filePath: string): Product | null {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const slug = typeof data.slug === "string" ? data.slug.trim() : "";
  const title = typeof data.title_ua === "string" ? data.title_ua.trim() : "";

  if (!slug || !title) {
    return null;
  }

  const images = parseStringArray(data.images).slice(0, MAX_IMAGES);

  return {
    title_ua: title,
    slug,
    category: parseCategory(data.category),
    price_uah: parseNumber(data.price_uah, 0),
    crm_id: parseNumber(data.crm_id, 0),
    rating_fb: parseNumber(data.rating_fb, 4.7),
    description: content.trim(),
    benefits: parseStringArray(data.benefits),
    how_to_order: parseStringArray(data.how_to_order),
    images,
    is_active: parseBoolean(data.is_active, false),
  };
}

export const getAllProducts = cache((): Product[] => {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b, "uk"));

  return files
    .map((file) => parseProductFromFile(path.join(CONTENT_DIR, file)))
    .filter((product): product is Product => Boolean(product));
});

export function getActiveProducts(category?: ProductCategory): Product[] {
  return getAllProducts().filter((product) => {
    if (!product.is_active) {
      return false;
    }

    if (category && product.category !== category) {
      return false;
    }

    return true;
  });
}

export function getProductBySlug(slug: string): Product | null {
  return getAllProducts().find((product) => product.slug === slug) ?? null;
}

export function getProductSlugs(): string[] {
  return getActiveProducts().map((product) => product.slug);
}

export function getRelatedProducts(slug: string, limit = 8): Product[] {
  return getActiveProducts()
    .filter((product) => product.slug !== slug)
    .slice(0, limit);
}
