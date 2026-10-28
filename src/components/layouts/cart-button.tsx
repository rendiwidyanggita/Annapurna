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
        "relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl",
        "text-slate-600 hover:text-slate-900",
        "hover:bg-slate-100 transition-colors duration-150 active:scale-[0.96]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
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
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs tabular-nums">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
