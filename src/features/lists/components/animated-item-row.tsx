"use client";

import { motion } from "motion/react";
import { SwipeableItemRow } from "./swipeable-item-row";
import { ListItemRow } from "./list-item-row";
import type { ShoppingItem } from "@/types/list";

/**
 * A list item with enter/exit animation, swipe gestures, and the category chip.
 * Shared by the grouped and flat (search) views. Must be rendered inside an
 * <AnimatePresence> with a stable key for exit animations to work.
 */
export function AnimatedItemRow({
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
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <SwipeableItemRow
        onSwipeRight={() => onToggle(item.id, !item.checked)}
        onSwipeLeft={() => onDelete(item.id)}
      >
        <ListItemRow
          item={item}
          categorySlug={categorySlug}
          canEdit={canEdit}
          onToggle={onToggle}
          onDelete={onDelete}
          onPickCategory={onPickCategory}
        />
      </SwipeableItemRow>
    </motion.div>
  );
}
