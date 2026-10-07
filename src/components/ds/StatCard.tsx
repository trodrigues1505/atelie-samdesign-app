import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  featured = false,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  /** Destaque visual: usado em um único card por tela. */
  featured?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 sm:p-5",
        featured
          ? "bg-primary text-primary-foreground"
          : "border border-border/70 bg-card text-card-foreground",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-sm font-medium", !featured && "text-muted-foreground")}>{label}</p>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            featured ? "bg-white/15" : "bg-primary-soft text-primary-ink"
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{value}</p>
      {hint && (
        <p className={cn("mt-1 text-xs", !featured && "text-muted-foreground")}>{hint}</p>
      )}
    </div>
  );
}
