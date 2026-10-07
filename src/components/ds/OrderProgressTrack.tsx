import { STATUS_FLOW, STATUS_LABEL, type OrderStatus } from "@/lib/orderStatus";
import { cn } from "@/lib/cn";

/** Faixa segmentada que mostra em qual etapa o pedido está. */
export function OrderProgressTrack({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const current = STATUS_FLOW.indexOf(status);
  if (current === -1) return null; // "cancelado" não faz parte do caminho

  return (
    <div
      role="img"
      aria-label={`Etapa ${current + 1} de ${STATUS_FLOW.length}: ${STATUS_LABEL[status]}`}
      className={cn("flex gap-1", className)}
    >
      {STATUS_FLOW.map((step, index) => (
        <span
          key={step}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            index <= current ? "bg-primary" : "bg-border"
          )}
        />
      ))}
    </div>
  );
}
