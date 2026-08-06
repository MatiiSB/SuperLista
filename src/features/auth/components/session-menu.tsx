"use client";

import { usePathname } from "next/navigation";
import { Building2, LogOut, ShieldCheck, UserCog } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkspaceRole, WorkspaceSummary } from "@/types/workspace";
import { useLogout } from "./use-logout";

/** Trimmed, serializable user shape — never includes user_id or tokens. */
export interface SessionUser {
  email: string | null;
  isAnonymous: boolean;
  fullName: string | null;
}

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: "Propietario",
  EDITOR: "Editor",
  VIEWER: "Visor",
};

export function SessionMenu({
  user,
  workspaces,
}: {
  user: SessionUser;
  workspaces: WorkspaceSummary[];
}) {
  const { logout, isPending } = useLogout();
  const activeId = usePathname().match(/^\/w\/([^/]+)/)?.[1];
  const active = workspaces.find((w) => w.id === activeId);
  const isGuest = user.isAnonymous;
  const display = user.fullName ?? user.email ?? "Invitado";
  const initials =
    (user.fullName ?? user.email?.split("@")[0] ?? "").slice(0, 2).toUpperCase() ||
    "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="max-w-40 truncate font-medium">{display}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate">{display}</span>
          {user.fullName && user.email && (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          <span>{isGuest ? "Invitado (Guest NFC)" : "Usuario autenticado"}</span>
        </div>
        {!isGuest && active && (
          <>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
              <Building2 className="size-3.5" />
              <span className="truncate">{active.name}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
              <UserCog className="size-3.5" />
              <span>{ROLE_LABELS[active.role]}</span>
            </div>
          </>
        )}
        {!isGuest && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => void logout()}
              className="text-destructive"
            >
              <LogOut className="size-3.5" />
              Cerrar sesión
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
