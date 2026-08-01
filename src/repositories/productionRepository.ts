import { supabase } from "@/api/supabaseClient";
import type { ProductionRecord } from "@/types/database";

export const productionRepository = {
  async listByOrder(orderId: string): Promise<ProductionRecord[]> {
    const { data, error } = await supabase
      .from("production")
      .select("*")
      .eq("order_id", orderId)
      .order("atualizado_em", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Registra uma nova etapa de produção para o pedido — o trigger no banco
   * (migration_fase2.sql) cria a notificação para o cliente automaticamente.
   */
  async addStage(
    orderId: string,
    etapa: ProductionRecord["etapa"],
    responsavel: string,
    observacao?: string
  ): Promise<ProductionRecord> {
    const { data, error } = await supabase
      .from("production")
      .insert({ order_id: orderId, etapa, responsavel, observacao: observacao ?? null })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },
};
