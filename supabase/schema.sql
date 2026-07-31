-- ============================================================
-- Ateliê Samdesign.ab — Schema inicial (Supabase / PostgreSQL)
-- Execute este arquivo no SQL Editor do painel do Supabase.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- users ----------
-- id = auth.users.id (mesmo UUID do Supabase Auth)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null unique,
  telefone text,
  auth_provider text not null default 'google',
  role text not null default 'cliente' check (role in ('cliente', 'admin')),
  endereco jsonb,
  created_at timestamptz not null default now()
);

-- ---------- products ----------
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text not null default '',
  categoria text not null,
  preco numeric(10,2) not null check (preco >= 0),
  peso_gramas integer not null default 0,
  fotos text[] not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- product_variants ----------
create table if not exists public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products (id) on delete cascade,
  tamanho text not null,
  cor text,
  tecido text,
  estoque integer not null default 0 check (estoque >= 0)
);

-- ---------- orders ----------
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete restrict,
  numero_pedido text not null unique,
  status text not null default 'recebido' check (status in (
    'recebido','pagamento_confirmado','em_producao','pronto',
    'etiqueta_gerada','enviado','saiu_para_entrega','entregue','cancelado'
  )),
  subtotal numeric(10,2) not null default 0,
  frete numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  endereco jsonb not null,
  cep text not null,
  rastreio text,
  etiqueta_url text,
  created_at timestamptz not null default now()
);

-- ---------- order_items ----------
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  variant_id uuid references public.product_variants (id) on delete set null,
  quantidade integer not null check (quantidade > 0),
  preco numeric(10,2) not null,
  observacoes text
);

-- ---------- production ----------
-- Histórico de etapas de produção de cada pedido (linha do tempo)
create table if not exists public.production (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders (id) on delete cascade,
  etapa text not null check (etapa in (
    'recebido','modelagem','corte','costura','acabamento',
    'conferencia','pronto','envio'
  )),
  responsavel text,
  observacao text,
  atualizado_em timestamptz not null default now()
);

-- ---------- notifications ----------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- índices ----------
create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_production_order_id on public.production (order_id);
create index if not exists idx_notifications_user_id on public.notifications (user_id);
create index if not exists idx_product_variants_product_id on public.product_variants (product_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.production enable row level security;
alter table public.notifications enable row level security;

-- Função auxiliar: usuário logado é admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- users: cada um vê/edita o próprio registro; admin vê todos
create policy "users_select_own_or_admin" on public.users
  for select using (auth.uid() = id or public.is_admin());
create policy "users_update_own_or_admin" on public.users
  for update using (auth.uid() = id or public.is_admin());
create policy "users_insert_self" on public.users
  for insert with check (auth.uid() = id);

-- products: leitura pública (loja); escrita só admin
create policy "products_select_all" on public.products
  for select using (true);
create policy "products_write_admin" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- product_variants: leitura pública; escrita só admin
create policy "variants_select_all" on public.product_variants
  for select using (true);
create policy "variants_write_admin" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- orders: cliente vê só os seus; admin vê todos
create policy "orders_select_own_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders_update_admin_or_owner_cancel" on public.orders
  for update using (public.is_admin() or auth.uid() = user_id);

-- order_items: segue a visibilidade do pedido pai
create policy "order_items_select_via_order" on public.order_items
  for select using (
    public.is_admin() or
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "order_items_insert_via_order" on public.order_items
  for insert with check (
    public.is_admin() or
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- production: cliente vê a linha do tempo do próprio pedido; só admin altera
create policy "production_select_via_order" on public.production
  for select using (
    public.is_admin() or
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "production_write_admin" on public.production
  for all using (public.is_admin()) with check (public.is_admin());

-- notifications: cada um vê só as suas
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id or public.is_admin());
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);
create policy "notifications_insert_admin" on public.notifications
  for insert with check (public.is_admin());
