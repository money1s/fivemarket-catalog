"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildLpCrmProductsPayload,
  buildLpCrmSenderPayload,
  buildOrderItemsString,
  generateOrderId,
} from "@/lib/order";
import { formatUah } from "@/lib/format";
import { trackInitiateCheckout } from "@/lib/pixels";
import { calcTotalPrice, calcTotalQty, useCartStore } from "@/lib/store/cart-store";
import { getStoredUtm, UtmData } from "@/lib/utm";

const CRM_ACTION = process.env.NEXT_PUBLIC_CRM_FORM_ACTION || "";
const CRM_API_KEY = process.env.NEXT_PUBLIC_CRM_API_KEY || "";
const CRM_OFFICE = process.env.NEXT_PUBLIC_CRM_OFFICE || "9";
const CRM_COUNTRY = process.env.NEXT_PUBLIC_CRM_COUNTRY || "UA";
const CRM_DELIVERY_ID = process.env.NEXT_PUBLIC_CRM_DELIVERY_ID || "1";
const CRM_PAYMENT_ID = process.env.NEXT_PUBLIC_CRM_PAYMENT_ID || "4";
const CRM_DEFAULT_EMAIL = process.env.NEXT_PUBLIC_CRM_DEFAULT_EMAIL || "";

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const total = calcTotalPrice(items);
  const totalQty = calcTotalQty(items);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [userIp, setUserIp] = useState("");
  const [utmData, setUtmData] = useState<UtmData>({});
  const [siteOrigin, setSiteOrigin] = useState("");
  const [siteHost, setSiteHost] = useState("");
  const [requestUri, setRequestUri] = useState("");
  const [referrer, setReferrer] = useState("");
  const [userAgent, setUserAgent] = useState("");
  const [orderId, setOrderId] = useState("");
  const hasTrackedRef = useRef(false);

  const orderItemsValue = useMemo(() => buildOrderItemsString(items), [items]);
  const lpCrmProducts = useMemo(() => buildLpCrmProductsPayload(items), [items]);
  const itemNamesList = useMemo(
    () => items.map((item) => `${item.title_ua} x${item.quantity}`).join(", "),
    [items]
  );
  const firstCrmId = items[0]?.crm_id ?? 0;
  const isCrmReady = CRM_ACTION.length > 0 && CRM_API_KEY.length > 0;
  const canSubmit = isCrmReady && orderId.length > 0;
  const senderInfo = useMemo(
    () =>
      buildLpCrmSenderPayload({
        host: siteHost,
        requestUri,
        remoteAddr: userIp,
        referrer,
        userAgent,
      }),
    [referrer, requestUri, siteHost, userAgent, userIp]
  );
  const thanksUrl = useMemo(() => {
    if (!siteOrigin) {
      return "";
    }

    const params = new URLSearchParams();
    params.set("name", fullName.trim());
    params.set("phone", phone.trim());
    params.set("total", String(total));
    params.set("quantity", String(totalQty));

    return `${siteOrigin}/thanks/?${params.toString()}`;
  }, [fullName, phone, siteOrigin, total, totalQty]);

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
      const location = window.location;
      setSiteOrigin(window.location.origin);
      setSiteHost(window.location.host);
      setRequestUri(`${location.pathname}${location.search || ""}`);
      setReferrer(document.referrer);
      setUserAgent(window.navigator.userAgent);
      setOrderId(generateOrderId());
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

        <div className="mb-4 rounded-lg border border-border/70 bg-secondary/40 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Ваше замовлення</p>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {items.slice(0, 3).map((item) => (
              <li key={item.slug} className="flex items-center justify-between gap-2">
                <span className="line-clamp-1">{item.title_ua}</span>
                <span className="shrink-0 text-muted-foreground">x{item.quantity}</span>
              </li>
            ))}
            {items.length > 3 ? (
              <li className="text-xs text-muted-foreground">+ ще {items.length - 3} товар(и)</li>
            ) : null}
          </ul>
        </div>

        <form
          method="POST"
          action={CRM_ACTION}
          className="space-y-4"
          onSubmit={(event) => {
            if (!isCrmReady) {
              event.preventDefault();
              return;
            }

            if (typeof window !== "undefined") {
              window.sessionStorage.setItem("fm_last_order_total", String(total));
              window.sessionStorage.setItem("fm_last_order_qty", String(totalQty));
              window.sessionStorage.setItem("fm_last_order_name", fullName.trim());
              window.sessionStorage.setItem("fm_last_order_phone", phone.trim());
              window.sessionStorage.setItem("fm_last_order_order_id", orderId);
            }
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="bayer_name" className="text-sm font-semibold">
              Повне ім&apos;я
            </label>
            <Input
              id="bayer_name"
              name="bayer_name"
              autoComplete="name"
              placeholder="Вкажіть ваше ім'я"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-semibold">
              Номер телефону
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+380..."
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </div>

          <input type="hidden" name="key" value={CRM_API_KEY} />
          <input type="hidden" name="order_id" value={orderId} />
          <input type="hidden" name="products" value={lpCrmProducts} />
          <input type="hidden" name="email" value={CRM_DEFAULT_EMAIL} />
          <input type="hidden" name="delivery" value={CRM_DELIVERY_ID} />
          <input type="hidden" name="delivery_adress" value="" />
          <input type="hidden" name="payment" value={CRM_PAYMENT_ID} />
          <input type="hidden" name="sender" value={senderInfo} />
          <input type="hidden" name="name" value={fullName.trim()} />
          <input type="hidden" name="price" value={total} />
          <input type="hidden" name="id" value={firstCrmId} />
          <input type="hidden" name="country" value={CRM_COUNTRY} />
          <input type="hidden" name="user_ip" value={userIp} />
          <input type="hidden" name="office" value={CRM_OFFICE} />
          <input type="hidden" name="quantity" value={totalQty} />
          <input type="hidden" name="order_items" value={orderItemsValue} />
          <input type="hidden" name="product_name" value={itemNamesList} />
          <input type="hidden" name="city" value="" />
          <input type="hidden" name="office_address" value="" />
          <input type="hidden" name="comment" value={itemNamesList} />
          <input type="hidden" name="utm_source" value={utmData.utm_source || ""} />
          <input type="hidden" name="utm_medium" value={utmData.utm_medium || ""} />
          <input type="hidden" name="utm_campaign" value={utmData.utm_campaign || ""} />
          <input type="hidden" name="utm_content" value={utmData.utm_content || ""} />
          <input type="hidden" name="utm_term" value={utmData.utm_term || ""} />
          <input type="hidden" name="success_url" value={thanksUrl} />
          <input type="hidden" name="redirect" value={thanksUrl} />
          <input type="hidden" name="success_redirect" value={thanksUrl} />

          {!isCrmReady ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Налаштуйте `NEXT_PUBLIC_CRM_FORM_ACTION` і `NEXT_PUBLIC_CRM_API_KEY`, щоб надсилати заявки в CRM.
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
            Оформити замовлення
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Натискаючи кнопку, ви підтверджуєте коректність введених даних для зв&apos;язку.
          </p>
        </form>
      </div>
    </section>
  );
}
