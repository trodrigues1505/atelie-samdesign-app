import { supabase } from "@/api/supabaseClient";
import type { Address, Order } from "@/types/database";
import type { CartItem } from "@/contexts/CartContext";

interface CreateOrderParams {
  userId: string;
  items: CartItem[];
  endereco: Address;
  subtotal: number;
  frete: number;
}

export const orderRepository = {
  async create({ userId, items, endereco, subtotal, frete }: CreateOrderParams): Promise<Order> {
    const numeroPedido = `PED-${Date.now()}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        numero_pedido: numeroPedido,
        status: "recebido",
        subtotal,
        frete,
        total: subtotal + frete,
        endereco,
        cep: endereco.cep,
      })
      .select("*")
      .single();

    if (orderError) throw orderError;

    const itemsPayload = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantidade: item.quantidade,
      preco: item.preco,
      observacoes: item.observacoes ?? null,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);
    if (itemsError) throw itemsError;

    // O primeiro registro em `production` é criado automaticamente por um
    // trigger no banco (ver supabase/migration_fase1.sql) — não precisa
    // ser inserido aqui, porque o cliente não tem permissão de escrita
    // direta em `production` (só admin, via RLS).

    return order;
  },

  async listByUser(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
};
