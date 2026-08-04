"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ListItemInput } from "@/types/list";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido").trim(),
  quantity: z.number().positive("Debe ser mayor a 0"),
});

type FormValues = z.infer<typeof schema>;

export function AddItemForm({
  onAdd,
  disabled,
}: {
  onAdd: (input: ListItemInput) => void;
  disabled?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", quantity: 1 },
  });

  function submit(values: FormValues) {
    onAdd({ name: values.name, quantity: values.quantity, unit: null });
    reset();
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex items-center gap-2 border-t pt-3"
    >
      <Input
        {...register("name")}
        placeholder="Agregar producto…"
        autoComplete="off"
        className="flex-1"
        aria-invalid={!!errors.name}
      />
      <Input
        {...register("quantity", { valueAsNumber: true })}
        type="number"
        inputMode="decimal"
        step="any"
        className="w-16 text-center tabular-nums"
        aria-label="Cantidad"
        aria-invalid={!!errors.quantity}
      />
      <Button type="submit" size="icon" disabled={disabled}>
        <Plus />
        <span className="sr-only">Agregar</span>
      </Button>
    </form>
  );
}
