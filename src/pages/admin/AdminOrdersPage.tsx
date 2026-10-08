import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Search } from "lucide-react";
import { orderRepository } from "@/repositories/orderRepository";
import type { Order } from "@/types/database";
import { formatBRL, formatDate } from "@/lib/format";
import { Badge } from "@/components/ds/Badge";
import { Chip } from "@/components/ds/Chip";
import { EmptyState } from "@/components/ds/EmptyState";
import { ErrorState } from "@/components/ds/ErrorState";
import { PageHeader } from "@/components/ds/PageHeader";
import { Skeleton } from "@/components/ds/Skeleton";
import { STATUS_FLOW, STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/lib/orderStatus";

const ALL_STATUSES: OrderStatus[] = [...STATUS_FLOW, "cancelado"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [statusFiltro, setStatusFiltro] = useState<OrderStatus | "todos">("todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    orderRepository
      .listAll()
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
  }, [attempt]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
    for (const o of orders) result[o.status] += 1;
    return result;
  }, [orders]);

  const filtrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (statusFiltro === "todos" || o.status === statusFiltro) &&
        o.numero_pedido.toLowerCase().includes(term)
    );
  }, [orders, statusFiltro, busca]);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Pedidos" description={loading ? undefined : `${orders.length} no total`} />

      <div className="mt-6 flex flex-col gap-3">
        <div className="relative sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Buscar pelo número do pedido"
            placeholder="Buscar pelo número do pedido"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input w-full pl-10"
          />
        </div>

        <div
          role="group"
          aria-label="Filtrar por status"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <Chip active={statusFiltro === "todos"} onClick={() => setStatusFiltro("todos")}>
            Todos ({orders.length})
          </Chip>
          {ALL_STATUSES.filter((s) => counts[s] > 0).map((s) => (
            <Chip key={s} active={statusFiltro === s} onClick={() => setStatusFiltro(s)}>
              {STATUS_LABEL[s]} ({counts[s]})
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : failed ? (
          <ErrorState
            title="Não foi possível carregar os pedidos"
            message="Verifique a conexão e tente de novo."
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum pedido encontrado"
            description={orders.length === 0 ? "Os pedidos da loja aparecem aqui." : "Tente outro filtro ou outro número."}
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/admin/pedidos/${order.id}`}
                  className="card block p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate font-semibold">{order.numero_pedido}</p>
                    <p className="shrink-0 font-semibold tabular-nums">{formatBRL(order.total)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">{formatDate(order.created_at)}</span>
                    <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
