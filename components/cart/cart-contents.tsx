"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUah } from "@/lib/format";
import { trackInitiateCheckout } from "@/lib/pixels";
import { calcTotalPrice, calcTotalQty, useCartStore } from "@/lib/store/cart-store";

interface CartContentsProps {
  onCheckoutClick?: () => void;
  compact?: boolean;
}

export function CartContents({ onCheckoutClick, compact = false }: CartContentsProps) {
  const items = useCartStore((state) => state.items);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);

  const totalPrice = calcTotalPrice(items);
  const totalQty = calcTotalQty(items);

  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-4 text-center">
        <p className="mb-3 text-sm text-muted-foreground">Кошик порожній. Додайте товари з каталогу.</p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Перейти в каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <article key={item.slug} className="rounded-lg border border-border/80 bg-card p-3 shadow-card">
            <div className="flex gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted">
                <Image src={item.image} alt={item.title_ua} fill className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold">{item.title_ua}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatUah(item.price_uah)}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center rounded-lg border border-border">
                    <button
                      type="button"
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-secondary"
                      onClick={() => decrementItem(item.slug)}
                      aria-label={`Зменшити кількість ${item.title_ua}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="inline-flex min-w-9 items-center justify-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-secondary"
                      onClick={() => incrementItem(item.slug)}
                      aria-label={`Збільшити кількість ${item.title_ua}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
                    onClick={() => removeItem(item.slug)}
                    aria-label={`Видалити ${item.title_ua}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-auto space-y-3 rounded-lg border border-border bg-secondary/40 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Товарів:</span>
          <span className="font-semibold">{totalQty}</span>
        </div>
        <div className="flex items-center justify-between text-base">
          <span className="font-semibold">Разом:</span>
          <span className="font-heading text-xl font-bold">{formatUah(totalPrice)}</span>
        </div>
        <Button
          asChild
          size={compact ? "default" : "lg"}
          className="w-full"
          onClick={() => {
            trackInitiateCheckout({ total: totalPrice, quantity: totalQty });
            onCheckoutClick?.();
          }}
        >
          <Link href="/checkout">Оформити замовлення</Link>
        </Button>
      </div>
    </div>
  );
}
