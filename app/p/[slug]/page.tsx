import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ProductCard } from "@/components/catalog/product-card";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { FacebookRatingBadge } from "@/components/product/facebook-rating-badge";
import { MobileStickyAddToCartBar } from "@/components/product/mobile-sticky-add-to-cart-bar";
import { ProductGalleryCarousel } from "@/components/product/product-gallery-carousel";
import { ViewContentTracker } from "@/components/product/view-content-tracker";
import { Badge } from "@/components/ui/badge";
import { formatUah } from "@/lib/format";
import { getProductBySlug, getProductSlugs, getRelatedProducts } from "@/lib/products";
import { getSiteUrl } from "@/lib/site";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

function stripMarkdown(input: string) {
  return input.replace(/[\*_`>#\-\[\]()]/g, " ").replace(/\s+/g, " ").trim();
}

export function generateStaticParams() {
  return getProductSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: ProductPageProps): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product || !product.is_active) {
    return {
      title: "Товар не знайдено",
    };
  }

  const firstImage = product.images[0] || "/uploads/placeholder-garden.svg";
  const siteUrl = getSiteUrl();
  const description = stripMarkdown(product.description).slice(0, 160);

  return {
    title: product.title_ua,
    description,
    openGraph: {
      title: product.title_ua,
      description,
      url: `${siteUrl}/p/${product.slug}`,
      images: [
        {
          url: firstImage,
          alt: product.title_ua,
        },
      ],
      type: "website",
      locale: "uk_UA",
    },
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug);

  if (!product || !product.is_active) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product.slug, 8);
  const firstImage = product.images[0] || "/uploads/placeholder-garden.svg";
  const siteUrl = getSiteUrl();

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title_ua,
    image: product.images.length ? product.images : [firstImage],
    description: stripMarkdown(product.description).slice(0, 250),
    offers: {
      "@type": "Offer",
      price: product.price_uah,
      priceCurrency: "UAH",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/p/${product.slug}`,
    },
  };

  return (
    <section className="container pb-28 pt-5 md:pb-8">
      <ViewContentTracker
        slug={product.slug}
        title={product.title_ua}
        price={product.price_uah}
        category={product.category}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="grid gap-2 md:grid-cols-[1.1fr_1fr] md:items-start md:gap-4">
          <ProductGalleryCarousel images={product.images} title={product.title_ua} />

          <div className="space-y-4">
            <h1 className="font-heading text-2xl font-bold leading-tight">{product.title_ua}</h1>
            <p className="font-heading text-3xl font-extrabold text-primary">{formatUah(product.price_uah)}</p>
            <AddToCartButton
              product={{
                slug: product.slug,
                title_ua: product.title_ua,
                price_uah: product.price_uah,
                crm_id: product.crm_id,
                image: firstImage,
              }}
              size="lg"
              className="w-full md:w-auto"
            />
            <FacebookRatingBadge rating={product.rating_fb} />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-7">
        <section>
          <h2 className="font-heading text-xl font-bold">Опис</h2>
          <div className="markdown-content mt-3 rounded-xl border border-border bg-card p-4 text-sm shadow-card md:text-base">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{product.description}</ReactMarkdown>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold">Переваги</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.benefits.map((benefit) => (
              <Badge key={benefit} variant="secondary" className="rounded-lg px-3 py-1.5 text-sm">
                {benefit}
              </Badge>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold">Як замовити</h2>
          <ol className="mt-3 space-y-2 rounded-xl border border-border bg-card p-4 shadow-card">
            {product.how_to_order.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm md:text-base">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="font-heading text-xl font-bold">Інші товари</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {relatedProducts.map((related, index) => (
            <ProductCard key={related.slug} product={related} priority={index < 2} />
          ))}
        </div>
      </section>

      <MobileStickyAddToCartBar
        product={{
          slug: product.slug,
          title_ua: product.title_ua,
          price_uah: product.price_uah,
          crm_id: product.crm_id,
          image: firstImage,
        }}
      />
    </section>
  );
}
