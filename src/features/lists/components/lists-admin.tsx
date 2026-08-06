"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  updateListAction,
  deleteListAction,
} from "@/features/lists/actions";
import type { ShoppingList } from "@/types/list";

/** List management: rename (EDITOR+) and delete (OWNER). */
export function ListsAdmin({
  lists,
  canEdit,
  canDelete,
}: {
  lists: ShoppingList[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [renaming, setRenaming] = useState<ShoppingList | null>(null);
  const [deleting, setDeleting] = useState<ShoppingList | null>(null);

  // No management actions available → hide the whole card.
  if (!canEdit && lists.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="size-4" />
          Listas
        </CardTitle>
        <CardDescription>
          {canEdit
            ? "Renombrá o eliminá las listas de este workspace."
            : "Listas de este workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {lists.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No hay listas.
          </p>
        )}
        {lists.map((list) => (
          <ListRow
            key={list.id}
            list={list}
            canEdit={canEdit}
            canDelete={canDelete}
            onRename={() => setRenaming(list)}
            onDelete={() => setDeleting(list)}
          />
        ))}
      </CardContent>

      <Dialog
        open={renaming !== null}
        onOpenChange={(o) => !o && setRenaming(null)}
      >
        {renaming && (
          <RenameListDialog list={renaming} onClose={() => setRenaming(null)} />
        )}
      </Dialog>

      <Dialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        {deleting && (
          <DeleteListDialog list={deleting} onClose={() => setDeleting(null)} />
        )}
      </Dialog>
    </Card>
  );
}

function ListRow({
  list,
  canEdit,
  canDelete,
  onRename,
  onDelete,
}: {
  list: ShoppingList;
  canEdit: boolean;
  canDelete: boolean;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{list.name}</p>
      </div>
      {list.is_default && <Badge variant="secondary">Default</Badge>}
      {canEdit && (
        <Button variant="ghost" size="icon-sm" onClick={onRename}>
          <Pencil className="size-4" />
        </Button>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}

function RenameListDialog({
  list,
  onClose,
}: {
  list: ShoppingList;
  onClose: () => void;
}) {
  const [name, setName] = useState(list.name);
  const [saving, setSaving] = useState(false);
  const dirty = name.trim() !== "" && name.trim() !== list.name;

  async function handleSave() {
    if (!dirty) return;
    setSaving(true);
    const result = await updateListAction(list.id, { name: name.trim() });
    setSaving(false);
    if (result.ok) {
      toast.success("Lista renombrada");
      onClose();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Renombrar lista</DialogTitle>
        <DialogDescription>Cambial el nombre de la lista.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2 py-2">
        <Label htmlFor="list-name">Nombre</Label>
        <Input
          id="list-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSave();
          }}
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function DeleteListDialog({
  list,
  onClose,
}: {
  list: ShoppingList;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteListAction(list.id);
    setDeleting(false);
    if (result.ok) {
      toast.success("Lista eliminada");
      onClose();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Eliminar lista</DialogTitle>
        <DialogDescription>
          Se va a eliminar{" "}
          <span className="text-foreground font-medium">{list.name}</span> con
          todos sus items. Esta acción no se puede deshacer.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Eliminando…" : "Eliminar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
