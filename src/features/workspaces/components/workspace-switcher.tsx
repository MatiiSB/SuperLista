"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronsUpDown, Plus, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createWorkspaceAction } from "@/features/workspaces/actions";
import { toast } from "sonner";
import type { WorkspaceSummary } from "@/types/workspace";

export function WorkspaceSwitcher({
  workspaces,
  activeId,
}: {
  workspaces: WorkspaceSummary[];
  activeId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Derive the active workspace from the URL (/w/[workspaceId]/...) unless
  // an explicit override is passed via props.
  const derivedActiveId = activeId ?? pathname.match(/^\/w\/([^/]+)/)?.[1];
  const active = workspaces.find((w) => w.id === derivedActiveId);

  async function handleCreate() {
    const result = await createWorkspaceAction("Nuevo Espacio");
    if (result.ok) {
      router.push(`/w/${result.data.id}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span className="max-w-32 truncate font-medium">
            {active?.name ?? "Workspaces"}
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Mis espacios</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.length === 0 && (
          <DropdownMenuItem disabled>No tienes espacios</DropdownMenuItem>
        )}
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => router.push(`/w/${ws.id}`)}
            className="justify-between"
          >
            <span className="truncate">{ws.name}</span>
            {ws.id === derivedActiveId && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void handleCreate()}>
          <Plus className="size-3.5" />
          Crear workspace
        </DropdownMenuItem>
        {derivedActiveId && (
          <DropdownMenuItem
            onClick={() => router.push(`/w/${derivedActiveId}/settings`)}
          >
            <Settings className="size-3.5" />
            Configuración
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
