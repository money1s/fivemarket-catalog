"use client";

import { ShoppingCart } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { trackAddToCart } from "@/lib/pixels";
import { useCartStore } from "@/lib/store/cart-store";

interface AddToCartButtonProps extends Omit<ButtonProps, "onClick"> {
  product: {
    slug: string;
    title_ua: string;
    price_uah: number;
    crm_id: number;
    image: string;
  };
}

export function AddToCartButton({ product, className, ...props }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <Button
      type="button"
      className={className}
      onClick={() => {
        addItem(product);
        trackAddToCart({
          slug: product.slug,
          title: product.title_ua,
          price: product.price_uah,
          quantity: 1,
        });
      }}
      {...props}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      Додати до кошика
    </Button>
  );
}
