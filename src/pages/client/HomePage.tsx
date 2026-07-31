import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Olá, {user?.nome ?? "..."}</h1>
        <button
          onClick={() => signOut()}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Sair
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-border p-4">
          <h2 className="font-semibold">Pedidos em andamento</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhum pedido em andamento no momento.
          </p>
        </section>
        <section className="rounded-lg border border-border p-4">
          <h2 className="font-semibold">Pedidos concluídos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhum pedido concluído ainda.
          </p>
        </section>
      </div>
    </div>
  );
}
