"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CATEGORIES } from "@/features/lists/categories";

/** Bottom-sheet category picker. Reports the chosen slug; parent persists. */
export function CategoryPicker({
  open,
  onOpenChange,
  productName,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-6">
        <SheetHeader>
          <SheetTitle>Elegir categoría</SheetTitle>
          <SheetDescription>
            {productName ? `Para “${productName}”` : "Seleccioná una categoría"}
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => onSelect(cat.slug)}
              className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors hover:bg-muted active:scale-95"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-muted-foreground text-xs font-medium">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
