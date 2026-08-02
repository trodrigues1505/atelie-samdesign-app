import type { ShippingProvider } from "@/types/shipping";
import { CorreiosProvider } from "@/services/shipping/CorreiosProvider";
import { MelhorEnvioProvider } from "@/services/shipping/MelhorEnvioProvider";

/**
 * Provider de frete ativo hoje. Trocar de transportadora é mudar só esta
 * linha — nenhum outro arquivo do app (checkout, painel admin) precisa
 * saber qual serviço está por trás.
 *
 * Enquanto a liberação da API de Preço/Prazo dos Correios não é confirmada
 * (contrato Clube Correios), o app usa o Melhor Envio. Para voltar aos
 * Correios assim que a integração estiver funcionando, troque a linha
 * abaixo para `new CorreiosProvider()`.
 */
export const shippingProvider: ShippingProvider = new MelhorEnvioProvider();

export { CorreiosProvider, MelhorEnvioProvider };
