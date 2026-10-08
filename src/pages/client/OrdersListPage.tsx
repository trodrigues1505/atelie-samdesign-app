import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackageOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { orderRepository } from "@/repositories/orderRepository";
import type { Order } from "@/types/database";
import { formatBRL, formatDate } from "@/lib/format";
import { Badge } from "@/components/ds/Badge";
import { EmptyState } from "@/components/ds/EmptyState";
import { ErrorState } from "@/components/ds/ErrorState";
import { OrderProgressTrack } from "@/components/ds/OrderProgressTrack";
import { PageHeader } from "@/components/ds/PageHeader";
import { Skeleton } from "@/components/ds/Skeleton";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/orderStatus";

export default function OrdersListPage() {
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

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Meus pedidos" />

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : failed ? (
          <ErrorState
            title="Não foi possível carregar seus pedidos"
            message="Verifique sua conexão e tente de novo."
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Você ainda não fez nenhum pedido"
            description="Quando você comprar, o acompanhamento aparece aqui."
            action={
              <Link to="/loja" className="btn btn-primary">
                Ir para a loja
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/pedido/${order.id}`}
                  className="card block p-4 transition-colors hover:bg-muted/40 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{order.numero_pedido}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{formatBRL(order.total)}</p>
                  </div>
                  <div className="mt-3">
                    <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                  </div>
                  <OrderProgressTrack status={order.status} className="mt-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
