"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateWorkspaceAction, deleteWorkspaceAction } from "@/features/workspaces/actions";

/** Owner-only workspace settings: rename + delete (danger zone). */
export function WorkspaceGeneralAdmin({
  workspaceId,
  name,
}: {
  workspaceId: string;
  name: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4" />
          Workspace
        </CardTitle>
        <CardDescription>Renombrá o eliminá este workspace.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <RenameForm workspaceId={workspaceId} name={name} />
        <DeleteWorkspace workspaceId={workspaceId} name={name} />
      </CardContent>
    </Card>
  );
}

function RenameForm({ workspaceId, name }: { workspaceId: string; name: string }) {
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const dirty = value.trim() !== "" && value.trim() !== name;

  async function handleSave() {
    if (!dirty) return;
    setSaving(true);
    const result = await updateWorkspaceAction(workspaceId, {
      name: value.trim(),
    });
    setSaving(false);
    if (result.ok) {
      toast.success("Workspace renombrado");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="ws-name">Nombre</Label>
      <div className="flex gap-2">
        <Input
          id="ws-name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSave();
          }}
        />
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}

function DeleteWorkspace({ workspaceId, name }: { workspaceId: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const canDelete = confirm.trim() === name && name !== "";

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    const result = await deleteWorkspaceAction(workspaceId);
    setDeleting(false);
    if (result.ok) {
      toast.success("Workspace eliminado");
      router.push("/");
    } else {
      toast.error(result.error);
      setOpen(false);
      setConfirm("");
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <p className="text-destructive text-sm font-medium">Zona de peligro</p>
      <p className="text-muted-foreground text-xs">
        Eliminar el workspace borra todas sus listas, items, invitaciones y miembros. Esta acción no
        se puede deshacer.
      </p>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setConfirm("");
        }}
      >
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm" className="w-fit">
            <Trash2 className="size-4" />
            Eliminar workspace
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar workspace</DialogTitle>
            <DialogDescription>
              Escribí <span className="text-foreground font-medium">{name}</span> para confirmar.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={name}
            autoFocus
          />
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting || !canDelete}>
              {deleting ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
