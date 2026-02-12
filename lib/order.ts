import { CartItem } from "@/lib/types";

export function buildOrderItemsString(items: CartItem[]): string {
  return items
    .map((item) => {
      const subtotal = item.price_uah * item.quantity;
      return `${item.title_ua} | qty:${item.quantity} | price:${item.price_uah} | subtotal:${subtotal} | crm_id:${item.crm_id}`;
    })
    .join("; ");
}
