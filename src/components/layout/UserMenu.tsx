import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, LogOut, User, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { cn } from "@/lib/cn";

export type UserMenuItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  className?: string;
};

export function UserMenu({ items = [] }: { items?: UserMenuItem[] }) {
  const { user, signOut } = useAuth();
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate("/login");
  }

  const initial = user?.nome?.trim().charAt(0).toUpperCase();
  const row =
    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors hover:bg-muted";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Menu da conta"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-ink transition-colors hover:bg-primary-soft/70"
      >
        {initial ? initial : <User className="h-5 w-5" aria-hidden="true" />}
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-pop rounded-2xl border border-border bg-card p-2 shadow-xl"
        >
          {user?.nome && (
            <p className="truncate px-3 pb-2 pt-1.5 text-sm font-medium">{user.nome}</p>
          )}

          {items.map(({ to, label, icon: Icon, className }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={cn(row, className)}
            >
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {label}
            </Link>
          ))}

          {!isInstalled && canInstall && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void promptInstall();
              }}
              className={row}
            >
              <Download className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Instalar aplicativo
            </button>
          )}

          <button type="button" onClick={handleSignOut} className={cn(row, "text-destructive")}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
