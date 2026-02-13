import { CartItem } from "@/lib/types";

export function buildOrderItemsString(items: CartItem[]): string {
  return items
    .map((item) => {
      const subtotal = item.price_uah * item.quantity;
      return `${item.title_ua} | qty:${item.quantity} | price:${item.price_uah} | subtotal:${subtotal} | crm_id:${item.crm_id}`;
    })
    .join("; ");
}

const textEncoder = new TextEncoder();

function phpSerializeString(value: string): string {
  return `s:${textEncoder.encode(value).length}:"${value}";`;
}

function phpSerializeLpCrmProduct(item: CartItem): string {
  const fields: Array<[string, string]> = [
    ["product_id", String(item.crm_id || 0)],
    ["price", String(item.price_uah)],
    ["count", String(item.quantity)],
  ];

  return `a:${fields.length}:{${fields.map(([key, value]) => `${phpSerializeString(key)}${phpSerializeString(value)}`).join("")}}`;
}

export function buildLpCrmProductsPayload(items: CartItem[]): string {
  const body = items.map((item, index) => `i:${index};${phpSerializeLpCrmProduct(item)}`).join("");
  return `a:${items.length}:{${body}}`;
}

export function generateOrderId(): string {
  return String(Date.now());
}
