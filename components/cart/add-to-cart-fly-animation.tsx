"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ADD_TO_CART_ANIMATION_EVENT,
  AddToCartAnimationDetail,
  dispatchCartIconBounce,
} from "@/lib/cart-animation";

interface FlyingItem {
  id: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  image: string;
  hasEntered: boolean;
  phase: "enter" | "fly";
}

const ITEM_SIZE = 50;
const PREVIEW_SIZE = 46;
const ENTER_DURATION_MS = 340;
const FLY_DURATION_MS = 1180;
const TOTAL_DURATION_MS = ENTER_DURATION_MS + FLY_DURATION_MS;

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
          hasEntered: false,
          phase: "enter",
        },
      ]);

      requestAnimationFrame(() => {
        setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, hasEntered: true } : item)));
      });

      window.setTimeout(() => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId && item.phase === "enter" ? { ...item, phase: "fly" } : item
          )
        );
      }, ENTER_DURATION_MS + 20);

      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.setTimeout(() => {
          dispatchCartIconBounce();
        }, ENTER_DURATION_MS + Math.max(120, FLY_DURATION_MS - 120));
      }

      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
      }, TOTAL_DURATION_MS + 120);
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
          className="pointer-events-none fixed z-[95] flex items-center justify-center transition-[transform,opacity] will-change-transform"
          style={{
            width: ITEM_SIZE + 2,
            height: ITEM_SIZE + 2,
            left: item.startX,
            top: item.startY,
            opacity: item.hasEntered ? (item.phase === "fly" ? 0.2 : 1) : 0,
            transform: item.hasEntered
              ? item.phase === "fly"
                ? `translate(${item.deltaX}px, ${item.deltaY}px) scale(0.4)`
                : "translate(0px, 0px) scale(1.08)"
              : "translate(0px, 0px) scale(0.42)",
            transitionDuration: item.phase === "fly" ? `${FLY_DURATION_MS}ms` : `${ENTER_DURATION_MS}ms`,
            transitionTimingFunction:
              item.phase === "fly" ? "cubic-bezier(0.22, 0.9, 0.25, 1)" : "cubic-bezier(0.2, 0.9, 0.2, 1)",
          }}
        >
          <span
            aria-hidden
            className="absolute rounded-full border-2 border-primary/55 bg-primary/12 transition-[transform,opacity]"
            style={{
              inset: -12,
              transform: item.hasEntered ? "scale(1.75)" : "scale(0.6)",
              opacity: item.hasEntered ? 0 : 0.95,
              transitionDuration: "360ms",
              transitionTimingFunction: "cubic-bezier(0.18, 0.8, 0.2, 1)",
            }}
          />
          <span
            aria-hidden
            className="absolute rounded-full bg-primary/25 transition-[transform,opacity]"
            style={{
              inset: -6,
              transform: item.hasEntered ? "scale(1.4)" : "scale(0.7)",
              opacity: item.hasEntered ? 0 : 0.9,
              transitionDuration: "320ms",
              transitionTimingFunction: "cubic-bezier(0.18, 0.8, 0.2, 1)",
            }}
          />
          <div
            className="relative overflow-hidden rounded-full border border-primary/45 bg-card shadow-soft"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
          >
            <Image src={item.image} alt="" fill className="object-cover" sizes={`${PREVIEW_SIZE}px`} />
          </div>
        </div>
      ))}
    </>
  );
}
