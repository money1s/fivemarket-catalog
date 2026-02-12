"use client";

import { CartContents } from "@/components/cart/cart-contents";

export function CartPage() {
  return (
    <section className="container py-5">
      <h1 className="font-heading text-2xl font-bold">Ваш кошик</h1>
      <p className="mt-1 text-sm text-muted-foreground">Змініть кількість або видаліть позиції перед оплатою.</p>
      <div className="mt-5 max-w-2xl">
        <CartContents />
      </div>
    </section>
  );
}
