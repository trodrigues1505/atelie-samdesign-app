export interface FreightQuote {
  servico: "PAC" | "SEDEX";
  nome: string;
  valor: number;
  prazoDias: number;
}

export interface TrackingEvent {
  data: string;
  descricao: string;
  local?: string;
}

export interface LabelResult {
  codigoRastreio: string;
  etiquetaUrlPdf: string;
}

/**
 * Contrato que qualquer transportadora precisa implementar.
 * Hoje só existe `CorreiosProvider`, mas Melhor Envio / Jadlog / Loggi
 * (mencionados no documento original) podem ser adicionados depois
 * implementando esta mesma interface — o resto do app (checkout, painel
 * admin) não muda nada, só troca qual provider é usado.
 */
export interface ShippingProvider {
  calcularFrete(params: { cepDestino: string; pesoGramas: number }): Promise<FreightQuote[]>;
  gerarEtiqueta(params: { orderId: string }): Promise<LabelResult>;
  cancelarEtiqueta(params: { codigoRastreio: string }): Promise<void>;
  consultarRastreio(codigoRastreio: string): Promise<TrackingEvent[]>;
}
