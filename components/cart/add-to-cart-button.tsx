"use client";

import { useRef } from "react";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, ButtonProps } from "@/components/ui/button";
import { dispatchAddToCartAnimation } from "@/lib/cart-animation";
import { trackAddToCart, trackInitiateCheckout } from "@/lib/pixels";
import { calcTotalPrice, calcTotalQty, useCartStore } from "@/lib/store/cart-store";

interface AddToCartButtonProps extends Omit<ButtonProps, "onClick"> {
  product: {
    slug: string;
    title_ua: string;
    price_uah: number;
    crm_id: number;
    image: string;
  };
  label?: string;
  checkoutAfterAdd?: boolean;
}

export function AddToCartButton({
  product,
  className,
  label = "Додати до кошика",
  checkoutAfterAdd = false,
  ...props
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  return (
    <Button
      ref={buttonRef}
      type="button"
      className={className}
      onClick={() => {
        const buttonRect = buttonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          dispatchAddToCartAnimation({
            x: buttonRect.left + buttonRect.width / 2,
            y: buttonRect.top + buttonRect.height / 2,
            image: product.image,
          });
        }

        addItem(product);
        trackAddToCart({
          slug: product.slug,
          title: product.title_ua,
          price: product.price_uah,
          quantity: 1,
        });

        if (checkoutAfterAdd) {
          const currentItems = useCartStore.getState().items;
          trackInitiateCheckout({
            total: calcTotalPrice(currentItems),
            quantity: calcTotalQty(currentItems),
          });
          window.setTimeout(() => {
            router.push("/checkout");
          }, 180);
        }
      }}
      {...props}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
