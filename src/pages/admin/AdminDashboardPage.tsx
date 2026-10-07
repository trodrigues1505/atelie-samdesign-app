import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Package, TriangleAlert, Users, Wallet } from "lucide-react";
import { orderRepository } from "@/repositories/orderRepository";
import { productRepository } from "@/repositories/productRepository";
import { userRepository } from "@/repositories/userRepository";
import { formatBRL } from "@/pages/client/ShopPage";
import { Skeleton } from "@/components/ds/Skeleton";
import { StatCard } from "@/components/ds/StatCard";
import { cn } from "@/lib/cn";
import { STATUS_FLOW, STATUS_LABEL, type OrderStatus } from "@/lib/orderStatus";

type Metrics = {
  pedidos: number;
  faturamento: number;
  clientes: number;
  produtos: number;
  porEtapa: Record<OrderStatus, number>;
};

const ETAPAS: OrderStatus[] = [...STATUS_FLOW, "cancelado"];

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setFailed(false);
      try {
        const [orders, users, products] = await Promise.all([
          orderRepository.listAll(),
          userRepository.listAll(),
          productRepository.listAllAdmin(),
        ]);
        if (!active) return;

        const porEtapa = Object.fromEntries(ETAPAS.map((s) => [s, 0])) as Record<
          OrderStatus,
          number
        >;
        for (const order of orders) porEtapa[order.status] += 1;

        setMetrics({
          pedidos: orders.length,
          faturamento: orders
            .filter((o) => o.status !== "cancelado")
            .reduce((sum, o) => sum + o.total, 0),
          clientes: users.filter((u) => u.role === "cliente").length,
          produtos: products.length,
          porEtapa,
        });
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Resumo da loja</p>
        </div>
        <Link to="/admin/pedidos" className="btn btn-secondary">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Ver pedidos
        </Link>
      </header>

      {failed ? (
        <div className="card mt-8 flex flex-col items-center px-6 py-10 text-center">
          <TriangleAlert className="h-6 w-6 text-warning" aria-hidden="true" />
          <p className="mt-3 font-medium">Não foi possível carregar as métricas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifique a conexão e tente de novo.
          </p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="btn btn-secondary mt-5"
          >
            Tentar de novo
          </button>
        </div>
      ) : loading || !metrics ? (
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Skeleton className="col-span-2 h-32 lg:col-span-1" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="col-span-2 h-32 lg:col-span-1" />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard
              featured
              icon={Wallet}
              label="Faturamento"
              value={formatBRL(metrics.faturamento)}
              hint="Não conta pedidos cancelados"
              className="col-span-2 lg:col-span-1"
            />
            <StatCard icon={ClipboardList} label="Pedidos" value={String(metrics.pedidos)} />
            <StatCard icon={Users} label="Clientes" value={String(metrics.clientes)} />
            <StatCard
              icon={Package}
              label="Produtos cadastrados"
              value={String(metrics.produtos)}
              className="col-span-2 lg:col-span-1"
            />
          </div>

          <section aria-labelledby="por-etapa" className="card mt-6 p-4 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="por-etapa" className="text-lg font-semibold tracking-tight">
                Pedidos por etapa
              </h2>
              <Link
                to="/admin/pedidos"
                className="text-sm font-medium text-primary-ink hover:underline"
              >
                Gerenciar
              </Link>
            </div>

            <ul className="mt-5 flex flex-col gap-3.5">
              {ETAPAS.map((etapa) => {
                const total = metrics.porEtapa[etapa];
                const maior = Math.max(1, ...Object.values(metrics.porEtapa));
                return (
                  <li key={etapa} className="grid grid-cols-[8.5rem_1fr_2rem] items-center gap-3 sm:grid-cols-[11rem_1fr_2.5rem]">
                    <span
                      className={cn(
                        "truncate text-sm",
                        total === 0 ? "text-muted-foreground" : "font-medium"
                      )}
                    >
                      {STATUS_LABEL[etapa]}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <span
                        className={cn(
                          "block h-full rounded-full transition-[width] duration-300",
                          etapa === "cancelado" ? "bg-destructive" : "bg-primary"
                        )}
                        style={{ width: `${(total / maior) * 100}%` }}
                      />
                    </span>
                    <span className="text-right text-sm font-medium tabular-nums">{total}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
