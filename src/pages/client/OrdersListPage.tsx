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

export default function OrdersListPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    orderRepository.listByUser(user.id).then(setOrders).finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Meus pedidos</h1>

      {loading && <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>}

      {!loading && orders.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">Você ainda não fez nenhum pedido.</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/pedido/${order.id}`}
            className="flex items-center justify-between rounded-lg border border-border p-4 transition hover:shadow-sm"
          >
            <div>
              <p className="font-medium">{order.numero_pedido}</p>
              <p className="text-xs text-muted-foreground">{STATUS_LABEL[order.status]}</p>
            </div>
            <span className="font-semibold">{formatBRL(order.total)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
