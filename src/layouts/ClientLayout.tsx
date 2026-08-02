import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { NotificationBell } from "@/components/NotificationBell";
import { InstallBanner } from "@/components/InstallBanner";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import logo from "@/assets/logo.png";

export default function ClientLayout() {
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <InstallBanner />

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

      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Ateliê Samdesign.ab" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-semibold">Ateliê Samdesign.ab</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" className="rounded-md px-3 py-1.5 transition hover:bg-muted">
            Início
          </Link>
          <Link to="/loja" className="rounded-md px-3 py-1.5 transition hover:bg-muted">
            Loja
          </Link>
          <Link to="/pedidos" className="rounded-md px-3 py-1.5 transition hover:bg-muted">
            Meus pedidos
          </Link>
          <Link to="/carrinho" className="relative rounded-md px-3 py-1.5 transition hover:bg-muted">
            Carrinho
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Link>
          {user && <NotificationBell userId={user.id} />}
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
