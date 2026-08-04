"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Copy, Pencil, Trash2, Nfc } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createNfcTagAction,
  updateNfcTagAction,
  deleteNfcTagAction,
} from "@/features/nfc/actions";
import type { NfcTag } from "@/types/nfc";
import type { ShoppingList } from "@/types/list";

export function NfcAdmin({
  tags,
  lists,
}: {
  tags: NfcTag[];
  lists: ShoppingList[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<NfcTag | null>(null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Nfc className="size-4" />
            Etiquetas NFC
          </CardTitle>
          <CardDescription>
            Asociá etiquetas físicas a listas para acceso de invitados.
          </CardDescription>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Crear
            </Button>
          </DialogTrigger>
          <CreateTagDialog lists={lists} onClose={() => setCreateOpen(false)} />
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {tags.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No hay etiquetas NFC. Creá la primera arriba.
          </p>
        )}
        {tags.map((tag) => (
          <TagRow
            key={tag.id}
            tag={tag}
            lists={lists}
            onEdit={() => setEditing(tag)}
          />
        ))}
      </CardContent>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        {editing && (
          <EditTagDialog
            tag={editing}
            lists={lists}
            onClose={() => setEditing(null)}
          />
        )}
      </Dialog>
    </Card>
  );
}

function TagRow({
  tag,
  lists,
  onEdit,
}: {
  tag: NfcTag;
  lists: ShoppingList[];
  onEdit: () => void;
}) {
  const listName =
    lists.find((l) => l.id === tag.shopping_list_id)?.name ?? "Lista eliminada";

  async function copyUrl() {
    const url = `${window.location.origin}/nfc/${tag.secret_token}`;
    await navigator.clipboard.writeText(url);
    toast.success("URL copiada al portapapeles");
  }

  async function toggleEnabled() {
    const result = await updateNfcTagAction(tag.id, { enabled: !tag.enabled });
    if (!result.ok) toast.error(result.error);
  }

  async function handleDelete() {
    const result = await deleteNfcTagAction(tag.id);
    if (result.ok) {
      toast.success("Etiqueta eliminada");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tag.name}</p>
        <p className="text-muted-foreground truncate text-xs">{listName}</p>
      </div>
      <Badge variant={tag.enabled ? "default" : "secondary"}>
        {tag.enabled ? "Activa" : "Inactiva"}
      </Badge>
      {tag.last_used_at && (
        <span className="text-muted-foreground hidden text-xs sm:inline">
          {new Date(tag.last_used_at).toLocaleDateString("es")}
        </span>
      )}
      <Button variant="ghost" size="icon-sm" onClick={copyUrl}>
        <Copy className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleEnabled}
        aria-label={tag.enabled ? "Desactivar" : "Activar"}
      >
        {tag.enabled ? "●" : "○"}
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={onEdit}>
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function CreateTagDialog({
  lists,
  onClose,
}: {
  lists: ShoppingList[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [listId, setListId] = useState(lists[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !listId) return;
    setSaving(true);
    const workspaceId = lists.find((l) => l.id === listId)?.workspace_id ?? "";
    const result = await createNfcTagAction(workspaceId, listId, name.trim());
    setSaving(false);
    if (result.ok) {
      toast.success("Etiqueta creada");
      onClose();
      setName("");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Crear etiqueta NFC</DialogTitle>
        <DialogDescription>
          Asociá una etiqueta física a una lista de compras.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nfc-name">Nombre</Label>
          <Input
            id="nfc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Heladera"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Lista asociada</Label>
          <Select value={listId} onValueChange={setListId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar lista" />
            </SelectTrigger>
            <SelectContent>
              {lists.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleCreate} disabled={saving || !name.trim() || !listId}>
          {saving ? "Creando…" : "Crear"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditTagDialog({
  tag,
  lists,
  onClose,
}: {
  tag: NfcTag;
  lists: ShoppingList[];
  onClose: () => void;
}) {
  const [name, setName] = useState(tag.name);
  const [listId, setListId] = useState(tag.shopping_list_id);
  const [enabled, setEnabled] = useState(tag.enabled);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateNfcTagAction(tag.id, {
      name: name.trim(),
      shopping_list_id: listId,
      enabled,
    });
    setSaving(false);
    if (result.ok) {
      toast.success("Etiqueta actualizada");
      onClose();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar etiqueta NFC</DialogTitle>
        <DialogDescription>
          Modificá el nombre, la lista asociada o el estado.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nfc-edit-name">Nombre</Label>
          <Input
            id="nfc-edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Lista asociada</Label>
          <Select value={listId} onValueChange={setListId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lists.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? "Activa" : "Inactiva"}
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
