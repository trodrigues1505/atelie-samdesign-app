import { Link, NavLink, Outlet } from "react-router-dom";
import { ClipboardList, LayoutDashboard, Package, Plug, Store, Users } from "lucide-react";
import { InstallBanner } from "@/components/InstallBanner";
import { FeedbackProvider } from "@/components/ds/Feedback";
import { BottomNav, type BottomNavItem } from "@/components/layout/BottomNav";
import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/cn";
import logo from "@/assets/logo.png";

const navItems: BottomNavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/integracoes", label: "Integrações", icon: Plug },
];

export default function AdminLayout() {
  return (
    <FeedbackProvider>
    <div className="min-h-screen animate-fade-in bg-background text-foreground lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border p-4 lg:flex">
        <Link to="/admin" className="mb-6 flex items-center gap-3 px-2 pt-2">
          <img src={logo} alt="" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-semibold tracking-tight">Painel admin</span>
        </Link>

        <nav aria-label="Administração" className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-soft text-primary-ink"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 lg:justify-end lg:px-6">
            <Link to="/admin" className="flex min-w-0 items-center gap-3 lg:hidden">
              <img src={logo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              <span className="truncate font-semibold tracking-tight">Painel admin</span>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <Link to="/" className="btn btn-sm btn-secondary hidden sm:inline-flex">
                <Store className="h-4 w-4" aria-hidden="true" />
                Ver como cliente
              </Link>
              <UserMenu
                items={[
                  { to: "/", label: "Ver como cliente", icon: Store, className: "sm:hidden" },
                ]}
              />
            </div>
          </div>
        </header>

        <InstallBanner className="lg:px-6" />

        <main className="pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <BottomNav items={navItems} className="lg:hidden" />
    </div>
    </FeedbackProvider>
  );
}
