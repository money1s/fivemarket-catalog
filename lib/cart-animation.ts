export const ADD_TO_CART_ANIMATION_EVENT = "fm:add-to-cart-anim";
export const CART_ICON_BOUNCE_EVENT = "fm:cart-icon-bounce";

export interface AddToCartAnimationDetail {
  x: number;
  y: number;
  image?: string;
}

export function dispatchAddToCartAnimation(detail: AddToCartAnimationDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(ADD_TO_CART_ANIMATION_EVENT, { detail }));
}

export function dispatchCartIconBounce() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(CART_ICON_BOUNCE_EVENT));
}
