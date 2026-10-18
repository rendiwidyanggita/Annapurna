"use client";

import { useIsMounted } from "@/hooks/use-is-mounted";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { ShoppingCart01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

export function CartButton({ className }: { className?: string }) {
  const isMounted = useIsMounted();
  const items = useCartStore((state) => state.items);

  const itemCount = isMounted ? items.reduce((acc, curr) => acc + curr.quantity, 0) : 0;

  return (
    <Link
      href={ROUTES.CART}
      className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)]",
        "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
        "hover:bg-[var(--color-border-soft)] transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        className
      )}
      aria-label={`Keranjang sewa (${itemCount} item)`}
    >
      <HugeiconsIcon
        icon={ShoppingCart01Icon}
        size={20}
        strokeWidth={1.5}
        color="currentColor"
      />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--color-surface)] shadow-xs animate-scale-in">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
