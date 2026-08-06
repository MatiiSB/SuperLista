"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { ShoppingItem } from "@/types/list";
import {
  type CategoryMap,
  getCategoryBySlug,
  orderedCategorySlugs,
  resolveCategory,
} from "@/features/lists/categories";
import { AnimatedItemRow } from "./animated-item-row";

/** Collapsible list grouped by category, ordered by the workspace's supermarket order. */
export function CategoryGroups({
  items,
  categoryMap,
  categoryOrder,
  canEdit,
  onToggle,
  onDelete,
  onPickCategory,
}: {
  items: ShoppingItem[];
  categoryMap: CategoryMap;
  categoryOrder: string[] | null;
  canEdit: boolean;
  onToggle: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
  onPickCategory: (itemName: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const order = orderedCategorySlugs(categoryOrder);
    const bySlug = new Map<string, ShoppingItem[]>();
    for (const slug of order) bySlug.set(slug, []);
    for (const item of items) {
      const slug = resolveCategory(item.custom_name, categoryMap) ?? "otros";
      (bySlug.get(slug) ?? bySlug.get("otros")!).push(item);
    }
    return order
      .map((slug) => ({ slug, items: bySlug.get(slug) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [items, categoryMap, categoryOrder]);

  function toggleCollapse(slug: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        const cat = getCategoryBySlug(group.slug);
        const isCollapsed = collapsed.has(group.slug);
        return (
          <section key={group.slug}>
            <button
              onClick={() => toggleCollapse(group.slug)}
              className="flex w-full items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className="text-base">{cat?.emoji ?? "📦"}</span>
              <span className="flex-1 text-sm font-medium">
                {cat?.label ?? group.slug}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {group.items.length}
              </span>
              <ChevronDown
                className={`text-muted-foreground size-4 transition-transform duration-150 ${
                  isCollapsed ? "" : "rotate-180"
                }`}
              />
            </button>
            {!isCollapsed && (
              <ul className="flex flex-col divide-y">
                <AnimatePresence initial={false}>
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <AnimatedItemRow
                        item={item}
                        categorySlug={group.slug}
                        canEdit={canEdit}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        onPickCategory={onPickCategory}
                      />
                    </li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
