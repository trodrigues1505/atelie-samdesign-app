import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type BottomNavItem = {
  to: string;
  label: string;
  /** Rótulo curto para a barra inferior (cabe melhor em telas estreitas). */
  shortLabel?: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: number;
};

/**
 * Barra de abas fixa no rodapé, no padrão de app instalado.
 * A visibilidade por breakpoint vem de fora (ex.: className="md:hidden").
 */
export function BottomNav({
  items,
  className,
}: {
  items: BottomNavItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur",
        className
      )}
    >
      <ul className="mx-auto flex max-w-lg items-stretch px-1">
        {items.map(({ to, label, shortLabel, icon: Icon, end, badge }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink
              to={to}
              end={end}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150",
                      isActive ? "bg-primary-soft text-primary-ink" : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {!!badge && badge > 0 && (
                      <span className="absolute right-1.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                        {badge > 9 ? "9+" : badge}
                        <span className="sr-only"> itens</span>
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "w-full truncate text-center",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {shortLabel ?? label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
