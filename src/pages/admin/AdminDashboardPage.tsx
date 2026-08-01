import { useEffect, useState } from "react";
import { orderRepository } from "@/repositories/orderRepository";
import { productRepository } from "@/repositories/productRepository";
import { userRepository } from "@/repositories/userRepository";
import { formatBRL } from "@/pages/client/ShopPage";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [faturamento, setFaturamento] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);

  useEffect(() => {
    async function load() {
      const [orders, users, products] = await Promise.all([
        orderRepository.listAll(),
        userRepository.listAll(),
        productRepository.listAllAdmin(),
      ]);

      setTotalPedidos(orders.length);
      setFaturamento(
        orders
          .filter((o) => o.status !== "cancelado")
          .reduce((sum, o) => sum + o.total, 0)
      );
      setTotalClientes(users.filter((u) => u.role === "cliente").length);
      setTotalProdutos(products.length);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Carregando métricas...</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Pedidos" value={String(totalPedidos)} />
          <MetricCard label="Faturamento" value={formatBRL(faturamento)} />
          <MetricCard label="Clientes" value={String(totalClientes)} />
          <MetricCard label="Produtos cadastrados" value={String(totalProdutos)} />
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
