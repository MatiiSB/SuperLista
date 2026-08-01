import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">SuperLista</h1>
        <p className="text-muted-foreground max-w-sm text-balance">
          Tus listas de compras del supermercado, simples y rápidas.
        </p>
      </div>
      <Button>Empezar</Button>
    </main>
  );
}
