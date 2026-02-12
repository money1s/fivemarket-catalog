/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    ttq?: {
      track?: (event: string, payload?: Record<string, unknown>) => void;
    };
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const CURRENCY = "UAH";

type PixelPayload = Record<string, unknown>;

function sendMeta(event: string, payload: PixelPayload) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, payload);
  }
}

function sendTikTok(event: string, payload: PixelPayload) {
  if (typeof window !== "undefined" && window.ttq?.track) {
    window.ttq.track(event, payload);
  }
}

function sendGtm(event: string, payload: PixelPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}

export function trackViewContent(input: { slug: string; title: string; price: number; category: string }) {
  const payload = {
    content_ids: [input.slug],
    content_name: input.title,
    content_category: input.category,
    content_type: "product",
    value: input.price,
    currency: CURRENCY,
  };

  sendMeta("ViewContent", payload);
  sendTikTok("ViewContent", payload);
  sendGtm("view_content", payload);
}

export function trackAddToCart(input: { slug: string; title: string; price: number; quantity?: number }) {
  const qty = input.quantity ?? 1;
  const payload = {
    content_ids: [input.slug],
    content_name: input.title,
    content_type: "product",
    value: input.price * qty,
    quantity: qty,
    currency: CURRENCY,
  };

  sendMeta("AddToCart", payload);
  sendTikTok("AddToCart", payload);
  sendGtm("add_to_cart", payload);
}

export function trackInitiateCheckout(input: { total: number; quantity: number }) {
  const payload = {
    value: input.total,
    quantity: input.quantity,
    currency: CURRENCY,
  };

  sendMeta("InitiateCheckout", payload);
  sendTikTok("InitiateCheckout", payload);
  sendGtm("initiate_checkout", payload);
}

export function trackPurchase(input: { total: number; quantity: number }) {
  const payload = {
    value: input.total,
    quantity: input.quantity,
    currency: CURRENCY,
  };

  sendMeta("Purchase", payload);
  sendTikTok("CompletePayment", payload);
  sendGtm("purchase", payload);
}
