"use client";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatUah } from "@/lib/format";

interface MobileStickyAddToCartBarProps {
  product: {
    slug: string;
    title_ua: string;
    price_uah: number;
    crm_id: number;
    image: string;
  };
}

export function MobileStickyAddToCartBar({ product }: MobileStickyAddToCartBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 py-3 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{product.title_ua}</p>
          <p className="text-sm font-bold text-primary">{formatUah(product.price_uah)}</p>
        </div>
        <AddToCartButton product={product} label="Оформити замовлення" className="ml-auto" />
      </div>
    </div>
  );
}
