import { Link, NavLink, Outlet } from "react-router-dom";
import { House, Package, ShoppingBag, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { NotificationBell } from "@/components/NotificationBell";
import { InstallBanner } from "@/components/InstallBanner";
import { BottomNav, type BottomNavItem } from "@/components/layout/BottomNav";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/cn";
import logo from "@/assets/logo.png";

export default function ClientLayout() {
  const { user } = useAuth();
  const { totalItems } = useCart();

  const items: BottomNavItem[] = [
    { to: "/", label: "Início", icon: House, end: true },
    { to: "/loja", label: "Loja", icon: ShoppingBag },
    { to: "/pedidos", label: "Meus pedidos", shortLabel: "Pedidos", icon: Package },
    { to: "/carrinho", label: "Carrinho", icon: ShoppingCart, badge: totalItems },
  ];
  const headerLinks = items.slice(0, 3);

  return (
    <div className="min-h-screen animate-fade-in bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img
              src={logo}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
            <span className="truncate text-[15px] font-semibold tracking-tight">
              Ateliê Samdesign.ab
            </span>
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {headerLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-soft text-primary-ink"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <Link
              to="/carrinho"
              aria-label={totalItems > 0 ? `Carrinho, ${totalItems} itens` : "Carrinho"}
              className="relative hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted md:flex"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {totalItems > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>
            {user && <NotificationBell key={user.id} userId={user.id} />}
            <UserMenu />
          </div>
        </div>
      </header>

      {user?.role === "admin" && (
        <div className="mx-auto max-w-6xl px-4 pt-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-primary-soft py-2 pl-4 pr-2 text-sm text-primary-ink">
            <span>
              Você está vendo o app como um <strong className="font-semibold">cliente</strong>.
            </span>
            <Link to="/admin" className="btn btn-sm btn-primary">
              Voltar ao painel
            </Link>
          </div>
        </div>
      )}

      <InstallBanner className="mx-auto max-w-6xl" />

      <main className="mx-auto max-w-6xl pb-24 md:pb-8">
        <Outlet />
      </main>

      <BottomNav items={items} className="md:hidden" />
    </div>
  );
}
