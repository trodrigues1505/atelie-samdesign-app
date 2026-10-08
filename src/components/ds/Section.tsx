import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Bloco de conteúdo com título: a unidade lógica das telas de detalhe e formulário. */
export function Section({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("card p-4 sm:p-5", className)}>
      <h2 className="font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
