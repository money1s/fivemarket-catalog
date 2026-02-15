"use client";

import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [total, setTotal] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    const resolvedName = params.get("name") || window.sessionStorage.getItem("fm_last_order_name") || "";
    const resolvedPhone = params.get("phone") || window.sessionStorage.getItem("fm_last_order_phone") || "";
    const resolvedTotal = toNumber(params.get("total")) || toNumber(window.sessionStorage.getItem("fm_last_order_total"));
    const resolvedQty =
      toNumber(params.get("quantity")) || toNumber(window.sessionStorage.getItem("fm_last_order_qty"));

    setCustomerName(resolvedName);
    setCustomerPhone(resolvedPhone);
    setTotal(resolvedTotal);
    setQuantity(resolvedQty);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || trackedRef.current) {
      return;
    }

    clearCart();
    trackedRef.current = true;
  }, [clearCart, ready]);

  return (
    <section className="container py-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 className="mt-4 text-center font-heading text-3xl font-bold text-primary">Дякуємо за замовлення</h1>
        <p className="mt-2 text-center text-base text-muted-foreground">
          Дані отримано. Наш оператор зв&apos;яжеться з вами в найближчий час.
        </p>

        <div className="mt-5 rounded-xl border border-border/80 bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Введені дані</p>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
              <span className="text-muted-foreground">Ім&apos;я</span>
              <span className="font-semibold text-foreground">{customerName || "Не вказано"}</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
              <span className="text-muted-foreground">Телефон</span>
              <span className="font-semibold text-foreground">{customerPhone || "Не вказано"}</span>
            </div>
            {total > 0 ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
                <span className="text-muted-foreground">Сума</span>
                <span className="font-semibold text-foreground">{total} грн</span>
              </div>
            ) : null}
            {quantity > 0 ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2">
                <span className="text-muted-foreground">Кількість товарів</span>
                <span className="font-semibold text-foreground">{quantity}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/80 bg-background px-3 py-2 text-sm text-muted-foreground">
          <Clock3 className="h-4 w-4 text-primary" />
          <span>Графік роботи: Пн-Нд з 9:00 до 21:00</span>
        </div>

        <Button asChild size="lg" className="mt-5 w-full">
          <Link href="/">Повернутись на головну</Link>
        </Button>
      </div>
    </section>
  );
}
