"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AddToCartFlyAnimation } from "@/components/cart/add-to-cart-fly-animation";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { HeaderNav } from "@/components/layout/header-nav";
import { captureUtmFromLocation } from "@/lib/utm";

export function AppShell({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      captureUtmFromLocation(window.location.search);
    }
  }, [pathname]);

  return (
    <>
      <HeaderNav onOpenCart={() => setIsCartOpen(true)} />
      <AddToCartFlyAnimation />
      <main id="main-content" className="min-h-screen pb-20 pt-[6.95rem]">
        {children}
      </main>
      <footer className="border-t border-border/80 bg-secondary/50 py-6">
        <div className="container text-center text-sm text-muted-foreground">
          FiveMarket • Якісне насіння та саджанці по Україні
        </div>
      </footer>
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
