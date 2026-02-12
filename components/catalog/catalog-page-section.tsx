import { ProductCard } from "@/components/catalog/product-card";
import { Product } from "@/lib/types";

interface CatalogPageSectionProps {
  title: string;
  subtitle: string;
  products: Product[];
}

export function CatalogPageSection({ title, subtitle, products }: CatalogPageSectionProps) {
  return (
    <section className="container py-5">
      <h1 className="font-heading text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      {products.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {products.map((product, index) => (
            <ProductCard key={product.slug} product={product} priority={index < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-card p-5 text-center text-sm text-muted-foreground">
          У цій категорії поки що немає активних товарів.
        </div>
      )}
    </section>
  );
}
