"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { ShoppingItem } from "@/types/list";

export function ListItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ShoppingItem;
  onToggle: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Checkbox
        checked={item.checked}
        onCheckedChange={(checked) => onToggle(item.id, checked === true)}
        aria-label={item.checked ? "Desmarcar" : "Marcar como comprado"}
      />

      <span
        className={`flex-1 truncate text-sm ${
          item.checked ? "text-muted-foreground line-through" : ""
        }`}
      >
        {item.custom_name}
      </span>

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
