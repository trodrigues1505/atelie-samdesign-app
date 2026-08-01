/**
 * Cálculo de frete PROVISÓRIO, baseado só no peso total do carrinho.
 * Isso existe apenas para o checkout funcionar de ponta a ponta antes da
 * integração real com os Correios (Fase 4 do roadmap — ver ShippingProvider).
 * Substitua `calculateFrete` pela chamada ao provider de frete quando
 * a integração estiver pronta; a assinatura da função pode ficar igual.
 */
export function calculateFrete(pesoTotalGramas: number): number {
  if (pesoTotalGramas <= 0) return 0;
  if (pesoTotalGramas <= 500) return 25;
  if (pesoTotalGramas <= 1000) return 35;
  if (pesoTotalGramas <= 2000) return 45;
  return 60;
}
