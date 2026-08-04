import { ClipboardList } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <ClipboardList className="text-muted-foreground size-12" strokeWidth={1.5} />
      <div className="flex flex-col gap-1">
        <p className="font-medium">Tu lista está vacía</p>
        <p className="text-muted-foreground text-sm">
          Agrega tu primer producto abajo para empezar.
        </p>
      </div>
    </div>
  );
}
