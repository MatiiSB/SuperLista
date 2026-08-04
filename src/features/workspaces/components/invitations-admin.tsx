"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Copy, Ban, Mail } from "lucide-react";
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
  createInvitationAction,
  revokeInvitationAction,
} from "@/features/workspaces/actions";
import type { WorkspaceInvitation } from "@/types/invitation";

export function InvitationsAdmin({
  invitations,
  workspaceId,
}: {
  invitations: WorkspaceInvitation[];
  workspaceId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4" />
            Invitaciones
          </CardTitle>
          <CardDescription>
            Compartí links seguros con expiración y límite de usos.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Crear
            </Button>
          </DialogTrigger>
          <CreateInvitationDialog
            workspaceId={workspaceId}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {invitations.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No hay invitaciones. Creá la primera arriba.
          </p>
        )}
        {invitations.map((inv) => (
          <InvitationRow key={inv.id} invitation={inv} />
        ))}
      </CardContent>
    </Card>
  );
}

function InvitationRow({ invitation: inv }: { invitation: WorkspaceInvitation }) {
  const isRevoked = inv.revoked_at !== null;
  const isExpired =
    inv.expires_at !== null && new Date(inv.expires_at) < new Date();
  const isMaxed =
    inv.max_uses !== null && inv.use_count >= inv.max_uses;
  const isValid = !isRevoked && !isExpired && !isMaxed;

  async function copyLink() {
    const url = `${window.location.origin}/join/${inv.token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  }

  async function handleRevoke() {
    const result = await revokeInvitationAction(inv.id);
    if (result.ok) {
      toast.success("Invitación revocada");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground truncate font-mono text-xs">
          {inv.token.slice(0, 8)}…{inv.token.slice(-4)}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <Badge variant="secondary">{inv.role}</Badge>
          {inv.max_uses !== null && (
            <span className="text-muted-foreground text-xs">
              {inv.use_count}/{inv.max_uses} usos
            </span>
          )}
          {inv.expires_at && (
            <span className="text-muted-foreground text-xs">
              expira {new Date(inv.expires_at).toLocaleDateString("es")}
            </span>
          )}
        </div>
      </div>
      <Badge variant={isValid ? "default" : "secondary"}>
        {isRevoked ? "Revocada" : isExpired ? "Expirada" : isMaxed ? "Agotada" : "Activa"}
      </Badge>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={copyLink}
        disabled={!isValid}
      >
        <Copy className="size-4" />
      </Button>
      {isValid && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={handleRevoke}
        >
          <Ban className="size-4" />
        </Button>
      )}
    </div>
  );
}

function CreateInvitationDialog({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  onClose: () => void;
}) {
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [expiryHours, setExpiryHours] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);

    const expiresAt =
      expiryHours.trim() !== ""
        ? new Date(Date.now() + Number(expiryHours) * 3600_000).toISOString()
        : null;

    const maxUsesNum = maxUses.trim() !== "" ? Number(maxUses) : null;

    const result = await createInvitationAction({
      workspaceId,
      role,
      expiresAt,
      maxUses: maxUsesNum,
    });

    setSaving(false);

    if (result.ok) {
      toast.success("Invitación creada");
      onClose();
      setExpiryHours("");
      setMaxUses("");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Crear invitación</DialogTitle>
        <DialogDescription>
          Generá un link seguro para invitar a alguien al workspace.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label>Rol del invitado</Label>
          <Select value={role} onValueChange={(v) => setRole(v as "EDITOR" | "VIEWER")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EDITOR">Editor (puede editar)</SelectItem>
              <SelectItem value="VIEWER">Viewer (solo lectura)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expiry">Expiración (horas, opcional)</Label>
          <Input
            id="expiry"
            type="number"
            min="1"
            placeholder="Ej: 24"
            value={expiryHours}
            onChange={(e) => setExpiryHours(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="max-uses">Límite de usos (opcional)</Label>
          <Input
            id="max-uses"
            type="number"
            min="1"
            placeholder="Ej: 1"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleCreate} disabled={saving}>
          {saving ? "Creando…" : "Crear"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
