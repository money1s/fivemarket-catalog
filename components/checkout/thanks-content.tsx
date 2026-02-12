"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { trackPurchase } from "@/lib/pixels";
import { useCartStore } from "@/lib/store/cart-store";

function toNumber(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ThanksContent() {
  const clearCart = useCartStore((state) => state.clearCart);
  const trackedRef = useRef(false);
  const [total, setTotal] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    const resolvedTotal = toNumber(params.get("total")) || toNumber(window.sessionStorage.getItem("fm_last_order_total"));
    const resolvedQty =
      toNumber(params.get("quantity")) || toNumber(window.sessionStorage.getItem("fm_last_order_qty"));

    setTotal(resolvedTotal);
    setQuantity(resolvedQty);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || trackedRef.current) {
      return;
    }

    trackPurchase({ total, quantity });
    clearCart();
    trackedRef.current = true;
  }, [clearCart, quantity, ready, total]);

  return (
    <section className="container py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
        <h1 className="font-heading text-3xl font-bold text-primary">Дякуємо за замовлення</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Менеджер зв&apos;яжеться з вами найближчим часом для підтвердження деталей доставки.
        </p>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/">Повернутися в каталог</Link>
        </Button>
      </div>
    </section>
  );
}
