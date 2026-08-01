import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

export default function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen animate-fade-in">
      {user?.role === "admin" && (
        <div className="flex items-center justify-between bg-primary px-4 py-2 text-sm text-primary-foreground">
          <span>
            Você está vendo como um <strong>cliente</strong> veria o app.
          </span>
          <Link
            to="/admin"
            className="rounded-md bg-white/20 px-3 py-1 font-medium hover:bg-white/30"
          >
            Voltar ao painel admin
          </Link>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Ateliê Samdesign.ab" className="h-10 w-10 rounded-full object-cover" />
            <h1 className="text-2xl font-bold">Olá, {user?.nome ?? "..."}</h1>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-muted"
          >
            Sair
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section className="rounded-lg border border-border p-4 transition hover:shadow-sm">
            <h2 className="font-semibold">Pedidos em andamento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nenhum pedido em andamento no momento.
            </p>
          </section>
          <section className="rounded-lg border border-border p-4 transition hover:shadow-sm">
            <h2 className="font-semibold">Pedidos concluídos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nenhum pedido concluído ainda.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
