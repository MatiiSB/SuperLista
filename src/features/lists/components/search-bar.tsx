"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Real-time product search input with a clear button. */
export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar producto…"
        autoComplete="off"
        inputMode="search"
        className="pl-8 pr-8"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-0.5 -translate-y-1/2"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
