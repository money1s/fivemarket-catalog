import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatUah } from "@/lib/format";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const coverImage = product.images[0] || "/uploads/placeholder-garden.svg";

  return (
    <Card className="overflow-hidden rounded-xl border-border/90">
      <div className="relative aspect-square w-full bg-muted">
        <Image
          src={coverImage}
          alt={product.title_ua}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
          priority={priority}
        />
      </div>
      <div className="space-y-3 p-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABELS[product.category]}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.title_ua}</h3>
          <p className="mt-1 font-heading text-lg font-bold text-primary">{formatUah(product.price_uah)}</p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/p/${product.slug}`}>Детальніше</Link>
          </Button>
          <AddToCartButton
            product={{
              slug: product.slug,
              title_ua: product.title_ua,
              price_uah: product.price_uah,
              crm_id: product.crm_id,
              image: coverImage,
            }}
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
}
