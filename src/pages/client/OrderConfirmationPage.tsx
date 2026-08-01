import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import type { Order } from "@/types/database";
import { formatBRL } from "@/pages/client/ShopPage";

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadOrder() {
      const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      if (isMounted) {
        setOrder(data);
        setLoading(false);
      }
    }

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Carregando...</p>;
  if (!order) return <p className="p-6 text-sm text-muted-foreground">Pedido não encontrado.</p>;

  return (
    <div className="mx-auto max-w-lg p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-bold">Pedido recebido!</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Número do pedido: <strong>{order.numero_pedido}</strong>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Total: <strong>{formatBRL(order.total)}</strong>
      </p>

      <Link
        to="/"
        className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
