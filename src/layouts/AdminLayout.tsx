import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { InstallBanner } from "@/components/InstallBanner";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/produtos", label: "Produtos" },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/clientes", label: "Clientes" },
  { to: "/admin/integracoes", label: "Integrações" },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <InstallBanner />

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Link to="/admin" className="flex items-center gap-2">
          <img src={logo} alt="Ateliê Samdesign.ab" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-semibold">Painel admin</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                "rounded-md px-3 py-1.5 transition hover:bg-muted " +
                (isActive ? "bg-muted font-medium" : "")
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/" className="rounded-md border border-border px-3 py-1.5 transition hover:bg-muted">
            Ver como cliente
          </Link>
          {!isInstalled && canInstall && (
            <button
              onClick={() => promptInstall()}
              className="rounded-md border border-border px-3 py-1.5 transition hover:bg-muted"
            >
              Instalar aplicativo
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="rounded-md border border-border px-3 py-1.5 transition hover:bg-muted"
          >
            Sair
          </button>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
