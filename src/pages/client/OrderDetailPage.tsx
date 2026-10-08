import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CircleCheck, PackageOpen } from "lucide-react";
import { orderRepository } from "@/repositories/orderRepository";
import { productionRepository } from "@/repositories/productionRepository";
import type { Order, OrderItem, ProductionRecord } from "@/types/database";
import { OrderTimeline } from "@/components/OrderTimeline";
import { Badge } from "@/components/ds/Badge";
import { EmptyState } from "@/components/ds/EmptyState";
import { ErrorState } from "@/components/ds/ErrorState";
import { OrderProgressTrack } from "@/components/ds/OrderProgressTrack";
import { PageHeader } from "@/components/ds/PageHeader";
import { Section } from "@/components/ds/Section";
import { Skeleton } from "@/components/ds/Skeleton";
import { formatBRL, formatDate } from "@/lib/format";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/orderStatus";

type ItemWithProduct = OrderItem & { products: { nome: string } | null };

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated);

  const [order, setOrder] = useState<Order | null>(null);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [items, setItems] = useState<ItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

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

    // Itens são um complemento: se não puderem ser lidos, o resto da página continua funcionando.
    orderRepository
      .listItems(id)
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [id, attempt]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-6 h-32" />
        <Skeleton className="mt-4 h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <ErrorState
          title="Não foi possível carregar o pedido"
          message={error}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <EmptyState
          icon={PackageOpen}
          title="Pedido não encontrado"
          action={
            <Link to="/pedidos" className="btn btn-primary">
              Ver meus pedidos
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      {justCreated && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-success-soft p-4 text-success">
          <CircleCheck className="h-6 w-6 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Pedido criado com sucesso!</p>
            <p className="text-sm">Você acompanha cada etapa aqui.</p>
          </div>
        </div>
      )}

      <PageHeader
        backTo="/pedidos"
        backLabel="Meus pedidos"
        title={`Pedido ${order.numero_pedido}`}
        description={formatDate(order.created_at)}
        actions={<Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>}
      />

      <OrderProgressTrack status={order.status} className="mt-5" />

      <div className="mt-6 flex flex-col gap-4">
        {items.length > 0 && (
          <Section title="Itens">
            <ul className="flex flex-col gap-2 text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.quantidade}x {item.products?.nome ?? "Produto"}
                  </span>
                  <span className="tabular-nums">{formatBRL(item.preco * item.quantidade)}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Valores">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatBRL(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span className="tabular-nums">{formatBRL(order.frete)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-3 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatBRL(order.total)}</span>
            </div>
          </div>
        </Section>

        <Section title="Rastreamento">
          {order.rastreio ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Código: </span>
              <span className="font-medium">{order.rastreio}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ainda não disponível — aparece aqui assim que o pedido for enviado.
            </p>
          )}
        </Section>
      </div>

      <h2 className="mt-8 text-lg font-semibold tracking-tight">Linha do tempo</h2>
      <div className="mt-4">
        <OrderTimeline records={records} />
      </div>
    </div>
  );
}
