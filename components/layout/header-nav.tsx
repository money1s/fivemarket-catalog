"use client";

import { ShoppingCart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { CATEGORY_TABS } from "@/lib/constants";
import { calcTotalQty, useCartStore } from "@/lib/store/cart-store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HeaderNavProps {
  onOpenCart: () => void;
}

export function HeaderNav({ onOpenCart }: HeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const cartQty = useCartStore((state) => calcTotalQty(state.items));

  const currentCategory = pathname.startsWith("/sadzhantsi")
    ? "sadzhantsi"
    : pathname.startsWith("/nasinnia")
      ? "nasinnia"
      : "all";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-primary/30 bg-primary text-primary-foreground shadow-soft">
      <div className="container px-3 py-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="font-heading text-base font-bold leading-tight">FiveMarket</p>
            <p className="text-[11px] text-primary-foreground/80">Насіння та саджанці для вашого саду</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="relative h-10 w-10 bg-white text-primary hover:bg-white/90"
            data-cart-anchor="true"
            onClick={onOpenCart}
            aria-label="Відкрити кошик"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartQty > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {cartQty}
              </span>
            ) : null}
          </Button>
        </div>

        <Tabs
          value={currentCategory ?? "all"}
          onValueChange={(value) => {
            const next = value === "all" ? "/" : value === "sadzhantsi" ? "/sadzhantsi" : "/nasinnia";
            router.push(next);
          }}
          className="w-full"
        >
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-primary-foreground/15 p-0.5">
            {CATEGORY_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="min-h-10 text-xs font-semibold text-primary-foreground data-[state=active]:bg-white data-[state=active]:text-primary"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}
