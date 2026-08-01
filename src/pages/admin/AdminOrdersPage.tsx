import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");

  useEffect(() => {
    orderRepository.listAll().then(setOrders).finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(
    () => orders.filter((o) => statusFiltro === "todos" || o.status === statusFiltro),
    [orders, statusFiltro]
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>

      <select
        value={statusFiltro}
        onChange={(e) => setStatusFiltro(e.target.value)}
        className="input mt-4 max-w-xs"
      >
        <option value="todos">Todos os status</option>
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {loading && <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>}

      {!loading && (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Número</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{order.numero_pedido}</td>
                  <td className="px-4 py-2">{STATUS_LABEL[order.status]}</td>
                  <td className="px-4 py-2">{formatBRL(order.total)}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/admin/pedidos/${order.id}`}
                      className="rounded-md border border-border px-3 py-1 text-xs font-medium transition hover:bg-muted"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
