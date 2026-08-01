import type { ProductionRecord } from "@/types/database";

const STAGE_LABEL: Record<ProductionRecord["etapa"], string> = {
  recebido: "Pedido recebido",
  modelagem: "Modelagem",
  corte: "Corte",
  costura: "Costura",
  acabamento: "Acabamento",
  conferencia: "Controle de qualidade",
  pronto: "Pronto",
  envio: "Enviado",
};

export function OrderTimeline({ records }: { records: ProductionRecord[] }) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ainda não há atualizações de produção para este pedido.
      </p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-6 border-l border-border pl-6">
      {records.map((record, idx) => {
        const isLast = idx === records.length - 1;
        return (
          <li key={record.id} className="relative">
            <span
              className={
                "absolute -left-[27px] flex h-4 w-4 items-center justify-center rounded-full text-[10px] " +
                (isLast
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/20 text-primary")
              }
            >
              ✓
            </span>
            <p className="text-sm font-medium">{STAGE_LABEL[record.etapa]}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(record.atualizado_em)}
              {record.responsavel ? ` — ${record.responsavel}` : ""}
            </p>
            {record.observacao && (
              <p className="mt-1 text-sm text-muted-foreground">{record.observacao}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
