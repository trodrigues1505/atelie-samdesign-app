import { supabase } from "@/api/supabaseClient";
import type { FreightQuote, LabelResult, ShippingProvider, TrackingEvent } from "@/types/shipping";

/**
 * Assim como o CorreiosProvider, este NUNCA fala direto com a API do
 * Melhor Envio — só chama a Edge Function `melhor-envio`
 * (supabase/functions/melhor-envio/index.ts), que guarda o token de
 * acesso em segredo.
 */
export class MelhorEnvioProvider implements ShippingProvider {
  private async invoke<T>(action: string, payload: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke("melhor-envio", {
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

  /** Troca o "code" do OAuth pelos tokens de acesso — só usado na tela
   * de Integrações do admin, não faz parte da interface ShippingProvider
   * porque é específico do fluxo de conexão do Melhor Envio. */
  async conectar(code: string): Promise<{ conectado: boolean }> {
    return this.invoke<{ conectado: boolean }>("conectar", { code });
  }
}
