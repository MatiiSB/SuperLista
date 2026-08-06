"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_CATEGORY_ORDER,
  getCategoryBySlug,
  orderedCategorySlugs,
} from "@/features/lists/categories";
import { updateCategoryOrderAction } from "@/features/workspaces/actions";

/** Owner-only: drag & drop reorder of the workspace's supermarket category order. */
export function CategoryOrderAdmin({
  workspaceId,
  order,
}: {
  workspaceId: string;
  order: string[] | null;
}) {
  const [items, setItems] = useState<string[]>(orderedCategorySlugs(order));
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  async function persist(newOrder: string[]) {
    setSaving(true);
    const result = await updateCategoryOrderAction(workspaceId, newOrder);
    setSaving(false);
    if (!result.ok) toast.error(result.error);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      void persist(next);
      return next;
    });
  }

  async function handleReset() {
    setItems(DEFAULT_CATEGORY_ORDER);
    await persist(DEFAULT_CATEGORY_ORDER);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">Orden del supermercado</CardTitle>
          <CardDescription>Arrastrá para ordenar las categorías.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} disabled={saving}>
          <RotateCcw className="size-4" />
          Default
        </Button>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1">
              {items.map((slug) => (
                <SortableCategory key={slug} slug={slug} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <p className="text-muted-foreground mt-3 text-xs">
          Este orden se aplica a todas las listas del workspace.
        </p>
      </CardContent>
    </Card>
  );
}

function SortableCategory({ slug }: { slug: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slug });
  const cat = getCategoryBySlug(slug);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-lg border p-2 ${
        isDragging ? "opacity-50 shadow-md" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground touch-none cursor-grab"
        aria-label={`Arrastrar ${cat?.label ?? slug}`}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="text-base">{cat?.emoji ?? "📦"}</span>
      <span className="text-sm font-medium">{cat?.label ?? slug}</span>
    </div>
  );
}
