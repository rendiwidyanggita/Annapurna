"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon } from "@hugeicons/core-free-icons";
import { CatalogSidebar, type CategoryOption } from "./catalog-sidebar";

interface CatalogMobileDrawerProps {
  categories: CategoryOption[];
}

export function CatalogMobileDrawer({ categories }: CatalogMobileDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-xs border-[var(--color-border)] text-[var(--color-primary)] font-medium"
          >
            <HugeiconsIcon icon={FilterIcon} size={15} />
            Filter Produk
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-xs sm:max-w-sm max-h-[85vh] overflow-y-auto bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[var(--color-primary)]">
              Filter Pencarian Katalog
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <CatalogSidebar
              categories={categories}
              onFilterApplied={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
