import type { Order } from "@/types/database";
import type { BadgeTone } from "@/components/ds/Badge";

export type OrderStatus = Order["status"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  recebido: "Recebido",
  pagamento_confirmado: "Pagamento confirmado",
  em_producao: "Em produção",
  pronto: "Pronto",
  etiqueta_gerada: "Etiqueta gerada",
  enviado: "Enviado",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

/** Caminho do pedido, na ordem em que as etapas acontecem (cancelado fica de fora). */
export const STATUS_FLOW: OrderStatus[] = [
  "recebido",
  "pagamento_confirmado",
  "em_producao",
  "pronto",
  "etiqueta_gerada",
  "enviado",
  "saiu_para_entrega",
  "entregue",
];

export const CONCLUDED_STATUSES: OrderStatus[] = ["entregue", "cancelado"];

export const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  recebido: "neutral",
  pagamento_confirmado: "info",
  em_producao: "warning",
  pronto: "primary",
  etiqueta_gerada: "info",
  enviado: "info",
  saiu_para_entrega: "primary",
  entregue: "success",
  cancelado: "danger",
};
