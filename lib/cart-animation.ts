export const ADD_TO_CART_ANIMATION_EVENT = "fm:add-to-cart-anim";

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

