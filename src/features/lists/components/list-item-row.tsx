"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { ShoppingItem } from "@/types/list";
import { getCategoryBySlug } from "@/features/lists/categories";

export function ListItemRow({
  item,
  categorySlug,
  canEdit,
  onToggle,
  onDelete,
  onPickCategory,
}: {
  item: ShoppingItem;
  categorySlug: string;
  canEdit: boolean;
  onToggle: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
  onPickCategory: (itemName: string) => void;
}) {
  const category = getCategoryBySlug(categorySlug);
  const chipClass =
    "flex shrink-0 items-center rounded-md bg-muted px-1.5 py-0.5 text-sm leading-none transition-colors active:scale-90";

  return (
    <div className="flex items-center gap-2 py-2">
      <Checkbox
        checked={item.checked}
        onCheckedChange={(checked) => onToggle(item.id, checked === true)}
        aria-label={item.checked ? "Desmarcar" : "Marcar como comprado"}
      />

      <span
        className={`flex-1 truncate text-sm transition-colors duration-150 ${
          item.checked ? "text-muted-foreground line-through" : ""
        }`}
      >
        {item.custom_name}
      </span>

      {category &&
        (canEdit ? (
          <button
            onClick={() => onPickCategory(item.custom_name)}
            className={`${chipClass} hover:bg-muted-foreground/20`}
            aria-label={`Categoría ${category.label}. Tocar para cambiar.`}
          >
            {category.emoji}
          </button>
        ) : (
          <span className={chipClass} aria-label={`Categoría ${category.label}`}>
            {category.emoji}
          </span>
        ))}

      {(item.quantity !== 1 || item.unit) && (
        <Badge variant="secondary" className="tabular-nums">
          {item.quantity}
          {item.unit ? ` ${item.unit}` : ""}
        </Badge>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(item.id)}
        aria-label="Eliminar"
      >
        <Trash2 />
      </Button>
    </div>
  );
}
