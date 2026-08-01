import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen animate-fade-in p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Ateliê Samdesign.ab" className="h-10 w-10 rounded-full object-cover" />
          <h1 className="text-2xl font-bold">Painel administrativo</h1>
        </div>
        <Link
          to="/"
          className="rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-muted"
        >
          Ver como cliente
        </Link>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Dashboard, pedidos, produção, produtos e clientes serão implementados aqui.
      </p>
    </div>
  );
}
