"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildOrderItemsString } from "@/lib/order";
import { formatUah } from "@/lib/format";
import { trackInitiateCheckout } from "@/lib/pixels";
import { calcTotalPrice, calcTotalQty, useCartStore } from "@/lib/store/cart-store";
import { getStoredUtm, UtmData } from "@/lib/utm";

const CRM_ACTION = process.env.NEXT_PUBLIC_CRM_FORM_ACTION || "https://example-crm.invalid/form";

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const total = calcTotalPrice(items);
  const totalQty = calcTotalQty(items);

  const [userIp, setUserIp] = useState("");
  const [utmData, setUtmData] = useState<UtmData>({});
  const [thanksUrl, setThanksUrl] = useState("");
  const hasTrackedRef = useRef(false);

  const orderItemsValue = useMemo(() => buildOrderItemsString(items), [items]);
  const firstCrmId = items[0]?.crm_id ?? 0;

  useEffect(() => {
    if (hasTrackedRef.current || totalQty <= 0) {
      return;
    }

    trackInitiateCheckout({ total, quantity: totalQty });
    hasTrackedRef.current = true;
  }, [total, totalQty]);

  useEffect(() => {
    setUtmData(getStoredUtm());

    if (typeof window !== "undefined") {
      setThanksUrl(`${window.location.origin}/thanks/`);
    }

    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((payload: { ip?: string }) => {
        if (payload?.ip) {
          setUserIp(payload.ip);
        }
      })
      .catch(() => {
        setUserIp("");
      });
  }, []);

  if (!items.length) {
    return (
      <section className="container py-6">
        <h1 className="font-heading text-2xl font-bold">Оформлення замовлення</h1>
        <p className="mt-2 text-sm text-muted-foreground">Кошик порожній. Додайте товари, щоб перейти до форми.</p>
        <Button asChild className="mt-5">
          <Link href="/">Повернутися до каталогу</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="container py-5">
      <h1 className="font-heading text-2xl font-bold">Оформлення замовлення</h1>
      <p className="mt-1 text-sm text-muted-foreground">Заповніть дані, і ми підтвердимо замовлення телефоном.</p>

      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">До сплати:</span>
          <span className="font-heading text-xl font-bold text-primary">{formatUah(total)}</span>
        </div>

        <form
          method="POST"
          action={CRM_ACTION}
          className="space-y-4"
          onSubmit={() => {
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem("fm_last_order_total", String(total));
              window.sessionStorage.setItem("fm_last_order_qty", String(totalQty));
            }
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-semibold">
              Повне ім&apos;я
            </label>
            <Input id="name" name="name" autoComplete="name" placeholder="Вкажіть ваше ім'я" required />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-semibold">
              Номер телефону
            </label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+380..." required />
          </div>

          <input type="hidden" name="price" value={total} />
          <input type="hidden" name="id" value={firstCrmId} />
          <input type="hidden" name="country" value="UA" />
          <input type="hidden" name="user_ip" value={userIp} />
          <input type="hidden" name="office" value="9" />
          <input type="hidden" name="quantity" value={totalQty} />
          <input type="hidden" name="order_items" value={orderItemsValue} />
          <input type="hidden" name="city" value="" />
          <input type="hidden" name="office_address" value="" />
          <input type="hidden" name="comment" value="" />
          <input type="hidden" name="utm_source" value={utmData.utm_source || ""} />
          <input type="hidden" name="utm_campaign" value={utmData.utm_campaign || ""} />
          <input type="hidden" name="utm_content" value={utmData.utm_content || ""} />
          <input type="hidden" name="utm_term" value={utmData.utm_term || ""} />
          <input type="hidden" name="success_url" value={thanksUrl} />
          <input type="hidden" name="redirect" value={thanksUrl} />

          <Button type="submit" size="lg" className="w-full">
            Оформити замовлення
          </Button>
        </form>
      </div>
    </section>
  );
}
