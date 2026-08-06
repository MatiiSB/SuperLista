"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateMemberRoleAction,
  removeMemberAction,
} from "@/features/workspaces/actions";
import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

export function MembersAdmin({
  members,
  currentUserId,
  isOwner,
}: {
  members: WorkspaceMember[];
  currentUserId: string;
  isOwner: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4" />
          Miembros
        </CardTitle>
        <CardDescription>
          {isOwner
            ? "Gestioná los roles y miembros del workspace."
            : "Miembros del workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isCurrentUser={member.user_id === currentUserId}
            isOwner={isOwner}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function MemberRow({
  member,
  isCurrentUser,
  isOwner,
}: {
  member: WorkspaceMember;
  isCurrentUser: boolean;
  isOwner: boolean;
}) {
  const [role, setRole] = useState<WorkspaceRole>(member.role);
  const [saving, setSaving] = useState(false);

  // Don't allow changing your own role or removing yourself.
  const canManage = isOwner && !isCurrentUser;

  // Display identity: never show the raw user_id. Prefer full_name, then email,
  // then a neutral fallback. The current user is always "Vos".
  const displayName = isCurrentUser
    ? "Vos"
    : (member.full_name ?? member.email ?? "Miembro");
  // Show the email as secondary when it isn't already the primary label.
  const emailSecondary =
    member.email && member.email !== displayName ? member.email : null;
  const dateLabel = new Date(member.joined_at).toLocaleDateString("es");

  async function handleRoleChange(newRole: WorkspaceRole) {
    setRole(newRole);
    setSaving(true);
    const result = await updateMemberRoleAction(
      member.workspace_id,
      member.user_id,
      newRole,
    );
    setSaving(false);
    if (!result.ok) {
      setRole(member.role); // revert
      toast.error(result.error);
    }
  }

  async function handleRemove() {
    const result = await removeMemberAction(
      member.workspace_id,
      member.user_id,
    );
    if (result.ok) {
      toast.success("Miembro removido");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="text-muted-foreground truncate text-xs">
          {emailSecondary ?? dateLabel}
        </p>
      </div>
      {canManage ? (
        <Select
          value={role}
          onValueChange={(v) => handleRoleChange(v as WorkspaceRole)}
          disabled={saving}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OWNER">Owner</SelectItem>
            <SelectItem value="EDITOR">Editor</SelectItem>
            <SelectItem value="VIEWER">Viewer</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Badge variant="secondary">{member.role}</Badge>
      )}
      {canManage && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={handleRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
