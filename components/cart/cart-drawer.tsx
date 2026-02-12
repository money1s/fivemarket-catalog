"use client";

import { CartContents } from "@/components/cart/cart-contents";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88vh] overflow-hidden sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:w-[420px] sm:rounded-l-xl sm:rounded-t-none"
      >
        <SheetHeader>
          <SheetTitle>Кошик</SheetTitle>
          <SheetDescription>Перевірте товари перед оформленням замовлення.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 h-[calc(100%-3.5rem)]">
          <CartContents compact onCheckoutClick={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
