import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { orderRepository } from "@/repositories/orderRepository";
import type { Order } from "@/types/database";
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

const CONCLUDED_STATUSES: Order["status"][] = ["entregue", "cancelado"];

export default function HomePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    orderRepository
      .listByUser(user.id)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user]);

  const emAndamento = orders.filter((o) => !CONCLUDED_STATUSES.includes(o.status));
  const concluidos = orders.filter((o) => CONCLUDED_STATUSES.includes(o.status));

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Olá, {user?.nome ?? "..."}</h1>
        <Link
          to="/loja"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Ir para a loja
        </Link>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando pedidos...</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <OrdersSection title="Pedidos em andamento" orders={emAndamento} emptyText="Nenhum pedido em andamento no momento." />
          <OrdersSection title="Pedidos concluídos" orders={concluidos} emptyText="Nenhum pedido concluído ainda." />
        </div>
      )}
    </div>
  );
}

function OrdersSection({
  title,
  orders,
  emptyText,
}: {
  title: string;
  orders: Order[];
  emptyText: string;
}) {
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="font-semibold">{title}</h2>
      {orders.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{order.numero_pedido}</p>
                <p className="text-xs text-muted-foreground">{STATUS_LABEL[order.status]}</p>
              </div>
              <span className="font-medium">{formatBRL(order.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
