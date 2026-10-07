import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PackageOpen, ShoppingBag, TriangleAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { orderRepository } from "@/repositories/orderRepository";
import type { Order } from "@/types/database";
import { formatBRL } from "@/pages/client/ShopPage";
import { Badge } from "@/components/ds/Badge";
import { EmptyState } from "@/components/ds/EmptyState";
import { OrderProgressTrack } from "@/components/ds/OrderProgressTrack";
import { Skeleton } from "@/components/ds/Skeleton";
import { CONCLUDED_STATUSES, STATUS_LABEL, STATUS_TONE } from "@/lib/orderStatus";

export default function HomePage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    orderRepository
      .listByUser(userId)
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, attempt]);

  const emAndamento = useMemo(
    () => orders.filter((o) => !CONCLUDED_STATUSES.includes(o.status)),
    [orders]
  );
  const concluidos = useMemo(
    () => orders.filter((o) => CONCLUDED_STATUSES.includes(o.status)),
    [orders]
  );

  const firstName = user?.nome?.trim().split(" ")[0];
  const summary = loading
    ? null
    : emAndamento.length === 0
      ? "Nenhum pedido em andamento no momento."
      : emAndamento.length === 1
        ? "Você tem 1 pedido em andamento."
        : `Você tem ${emAndamento.length} pedidos em andamento.`;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Olá{firstName ? `, ${firstName}` : ""}
          </h1>
          {summary ? (
            <p className="mt-1 text-muted-foreground">{summary}</p>
          ) : (
            <Skeleton className="mt-2 h-5 w-56" />
          )}
        </div>
        <Link to="/loja" className="btn btn-primary">
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          Ir para a loja
        </Link>
      </header>

      {failed ? (
        <div className="card mt-8 flex flex-col items-center px-6 py-10 text-center">
          <TriangleAlert className="h-6 w-6 text-warning" aria-hidden="true" />
          <p className="mt-3 font-medium">Não foi possível carregar seus pedidos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifique sua conexão e tente de novo.
          </p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="btn btn-secondary mt-5"
          >
            Tentar de novo
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section aria-labelledby="em-andamento">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="em-andamento" className="text-lg font-semibold tracking-tight">
                Pedidos em andamento
              </h2>
              <Link
                to="/pedidos"
                className="text-sm font-medium text-primary-ink hover:underline"
              >
                Ver todos os pedidos
              </Link>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : emAndamento.length === 0 ? (
                <EmptyState
                  icon={PackageOpen}
                  title="Nenhum pedido em andamento"
                  description="Quando você fizer um pedido, o acompanhamento aparece aqui."
                  action={
                    <Link to="/loja" className="btn btn-primary">
                      Ver a loja
                    </Link>
                  }
                />
              ) : (
                <ul className="flex flex-col gap-3">
                  {emAndamento.map((order) => (
                    <li key={order.id} className="card p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{order.numero_pedido}</p>
                          <Badge tone={STATUS_TONE[order.status]} className="mt-2">
                            {STATUS_LABEL[order.status]}
                          </Badge>
                        </div>
                        <p className="shrink-0 font-semibold tabular-nums">
                          {formatBRL(order.total)}
                        </p>
                      </div>
                      <OrderProgressTrack status={order.status} className="mt-4" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section aria-labelledby="concluidos">
            <h2 id="concluidos" className="text-lg font-semibold tracking-tight">
              Pedidos concluídos
            </h2>

            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-24" />
              ) : concluidos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pedido concluído ainda.</p>
              ) : (
                <ul className="card flex flex-col gap-4 p-4">
                  {concluidos.map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{order.numero_pedido}</p>
                        <Badge tone={STATUS_TONE[order.status]} className="mt-1.5">
                          {STATUS_LABEL[order.status]}
                        </Badge>
                      </div>
                      <p className="shrink-0 text-sm font-medium tabular-nums">
                        {formatBRL(order.total)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
