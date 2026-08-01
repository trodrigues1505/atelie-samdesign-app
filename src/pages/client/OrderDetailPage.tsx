import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { orderRepository } from "@/repositories/orderRepository";
import { productionRepository } from "@/repositories/productionRepository";
import type { Order, ProductionRecord } from "@/types/database";
import { OrderTimeline } from "@/components/OrderTimeline";
import { formatBRL } from "@/pages/client/ShopPage";

const STATUS_LABEL: Record<Order["status"], string> = {
  recebido: "Recebido",
  pagamento_confirmado: "Pagamento confirmado",
  em_producao: "Em produção",
  pronto: "Pronto",
  etiqueta_gerada: "Etiqueta gerada",
  enviado: "Enviado",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated);

  const [order, setOrder] = useState<Order | null>(null);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      try {
        const [orderData, productionData] = await Promise.all([
          orderRepository.getById(id!),
          productionRepository.listByOrder(id!),
        ]);
        if (isMounted) {
          setOrder(orderData);
          setRecords(productionData);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Erro ao carregar pedido.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Carregando...</p>;
  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!order) return <p className="p-6 text-sm text-muted-foreground">Pedido não encontrado.</p>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      {justCreated && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-primary/10 p-4 text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            ✓
          </span>
          <p className="text-sm font-medium">Pedido criado com sucesso!</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Pedido {order.numero_pedido}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="mt-6 rounded-lg border border-border p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatBRL(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Frete</span>
          <span>{formatBRL(order.frete)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
          <span>Total</span>
          <span>{formatBRL(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold">Rastreamento</h2>
        {order.rastreio ? (
          <p className="mt-1 text-sm text-muted-foreground">Código: {order.rastreio}</p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Ainda não disponível — aparece aqui assim que o pedido for enviado.
          </p>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Linha do tempo</h2>
      <div className="mt-4">
        <OrderTimeline records={records} />
      </div>

      <Link
        to="/"
        className="mt-8 inline-block rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
      >
        Voltar ao início
      </Link>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
