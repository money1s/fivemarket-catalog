"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ADD_TO_CART_ANIMATION_EVENT, AddToCartAnimationDetail } from "@/lib/cart-animation";

interface FlyingItem {
  id: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  image: string;
  active: boolean;
}

const ITEM_SIZE = 32;
const ANIMATION_DURATION_MS = 520;

export function AddToCartFlyAnimation() {
  const [items, setItems] = useState<FlyingItem[]>([]);

  useEffect(() => {
    const onFlyToCart = (event: Event) => {
      const detail = (event as CustomEvent<AddToCartAnimationDetail>).detail;
      if (!detail) {
        return;
      }

      const cartAnchor = document.querySelector<HTMLElement>("[data-cart-anchor='true']");
      if (!cartAnchor) {
        return;
      }

      const anchorRect = cartAnchor.getBoundingClientRect();
      const startX = detail.x - ITEM_SIZE / 2;
      const startY = detail.y - ITEM_SIZE / 2;
      const targetX = anchorRect.left + anchorRect.width / 2 - ITEM_SIZE / 2;
      const targetY = anchorRect.top + anchorRect.height / 2 - ITEM_SIZE / 2;
      const itemId = Date.now() + Math.floor(Math.random() * 1000);

      setItems((prev) => [
        ...prev,
        {
          id: itemId,
          startX,
          startY,
          deltaX: targetX - startX,
          deltaY: targetY - startY,
          image: detail.image || "/uploads/placeholder-garden.svg",
          active: false,
        },
      ]);

      requestAnimationFrame(() => {
        setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, active: true } : item)));
      });

      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
      }, ANIMATION_DURATION_MS + 80);
    };

    window.addEventListener(ADD_TO_CART_ANIMATION_EVENT, onFlyToCart as EventListener);
    return () => {
      window.removeEventListener(ADD_TO_CART_ANIMATION_EVENT, onFlyToCart as EventListener);
    };
  }, []);

  return (
    <>
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-none fixed z-[90] h-8 w-8 overflow-hidden rounded-full border border-primary/40 bg-card shadow-soft transition-[transform,opacity] duration-500 ease-out"
          style={{
            left: item.startX,
            top: item.startY,
            opacity: item.active ? 0.25 : 1,
            transform: item.active
              ? `translate(${item.deltaX}px, ${item.deltaY}px) scale(0.35)`
              : "translate(0px, 0px) scale(1)",
          }}
        >
          <div className="relative h-full w-full">
            <Image src={item.image} alt="" fill className="object-cover" sizes="32px" />
          </div>
        </div>
      ))}
    </>
  );
}

