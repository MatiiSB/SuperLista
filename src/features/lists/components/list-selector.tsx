"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createListAction } from "@/features/lists/actions";
import { toast } from "sonner";
import type { ShoppingList } from "@/types/list";

export function ListSelector({
  lists,
  activeId,
  workspaceId,
  canCreate,
}: {
  lists: ShoppingList[];
  activeId?: string;
  workspaceId: string;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    const result = await createListAction(workspaceId, name.trim());
    setCreating(false);
    if (result.ok) {
      setOpen(false);
      setName("");
      router.push(`/w/${workspaceId}/l/${result.data.id}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {lists.map((list) => (
        <Button
          key={list.id}
          variant={list.id === activeId ? "default" : "outline"}
          size="sm"
          className="shrink-0"
          onClick={() => router.push(`/w/${workspaceId}/l/${list.id}`)}
        >
          {list.name}
          {list.id === activeId && <Check className="size-3.5" />}
        </Button>
      ))}

      {canCreate && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="shrink-0">
              <Plus />
              <span className="sr-only">Crear lista</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nueva lista</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Nombre de la lista"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreate();
              }}
              autoFocus
            />
            <DialogFooter>
              <Button
                onClick={() => void handleCreate()}
                disabled={creating || !name.trim()}
              >
                {creating ? "Creando…" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
