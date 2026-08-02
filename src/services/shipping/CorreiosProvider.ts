import { supabase } from "@/api/supabaseClient";
import type { FreightQuote, LabelResult, ShippingProvider, TrackingEvent } from "@/types/shipping";

/**
 * Este provider NUNCA fala direto com a API dos Correios — ele só chama a
 * Edge Function `correios` (supabase/functions/correios/index.ts), que é
 * quem guarda as credenciais do contrato em segredo. Fazer a chamada aqui
 * no front-end exporia usuário/senha do contrato no JavaScript público.
 */
class CorreiosProvider implements ShippingProvider {
  private async invoke<T>(action: string, payload: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke("correios", {
      body: { action, ...payload },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as T;
  }

  async calcularFrete(params: { cepDestino: string; pesoGramas: number }): Promise<FreightQuote[]> {
    return this.invoke<FreightQuote[]>("calcularFrete", params);
  }

  async gerarEtiqueta(params: { orderId: string }): Promise<LabelResult> {
    return this.invoke<LabelResult>("gerarEtiqueta", params);
  }

  async cancelarEtiqueta(params: { codigoRastreio: string }): Promise<void> {
    await this.invoke<void>("cancelarEtiqueta", params);
  }

  async consultarRastreio(codigoRastreio: string): Promise<TrackingEvent[]> {
    return this.invoke<TrackingEvent[]>("consultarRastreio", { codigoRastreio });
  }
}

/** Provider ativo hoje. Trocar aqui é o único lugar que muda ao adotar
 * outra transportadora no futuro (ex: `new MelhorEnvioProvider()`). */
export const shippingProvider: ShippingProvider = new CorreiosProvider();
