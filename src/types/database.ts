// Tipos gerados a partir do schema do Supabase (ver supabase/schema.sql)
// Mantidos manualmente por enquanto; podem ser substituídos por
// `supabase gen types typescript` quando o projeto estiver criado.

export type UUID = string;

export type OrderStatus =
  | "recebido"
  | "pagamento_confirmado"
  | "em_producao"
  | "pronto"
  | "etiqueta_gerada"
  | "enviado"
  | "saiu_para_entrega"
  | "entregue"
  | "cancelado";

export type ProductionStage =
  | "recebido"
  | "modelagem"
  | "corte"
  | "costura"
  | "acabamento"
  | "conferencia"
  | "pronto"
  | "envio";

export type UserRole = "cliente" | "admin";

export interface User {
  id: UUID;
  auth_provider: "google" | "github";
  nome: string;
  email: string;
  telefone: string | null;
  role: UserRole;
  endereco: Address | null;
  created_at: string;
}

export interface Address {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Product {
  id: UUID;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  peso_gramas: number;
  fotos: string[];
  ativo: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: UUID;
  product_id: UUID;
  tamanho: string;
  cor: string | null;
  tecido: string | null;
  estoque: number;
}

export interface Order {
  id: UUID;
  user_id: UUID;
  numero_pedido: string;
  status: OrderStatus;
  subtotal: number;
  frete: number;
  total: number;
  endereco: Address;
  cep: string;
  rastreio: string | null;
  etiqueta_url: string | null;
  created_at: string;
}

export interface OrderItem {
  id: UUID;
  order_id: UUID;
  product_id: UUID;
  variant_id: UUID | null;
  quantidade: number;
  preco: number;
  observacoes: string | null;
}

export interface ProductionRecord {
  id: UUID;
  order_id: UUID;
  etapa: ProductionStage;
  responsavel: string | null;
  observacao: string | null;
  atualizado_em: string;
}

export interface Notification {
  id: UUID;
  user_id: UUID;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}
