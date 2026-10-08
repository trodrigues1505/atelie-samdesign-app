import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Rótulo + campo + dica/erro. Use junto com a classe `.input` e aria-invalid no campo. */
export function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm font-medium", className)}>
      {label}
      {children}
      {hint && !error && (
        <span className="text-xs font-normal text-muted-foreground">{hint}</span>
      )}
      {error && (
        <span role="alert" className="text-xs font-normal text-destructive">
          {error}
        </span>
      )}
    </label>
  );
}
