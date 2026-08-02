-- ============================================================
-- Fase 4b — Armazenamento de tokens OAuth (Melhor Envio)
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- Guarda o access_token/refresh_token da conexão OAuth com o Melhor Envio.
-- Só a Edge Function (via service_role, que ignora RLS) lê e escreve aqui —
-- por isso não existe nenhuma policy de RLS liberando acesso ao cliente.
create table if not exists public.integration_tokens (
  provider text primary key,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.integration_tokens enable row level security;
-- Nenhuma policy = ninguém além do service_role (usado pela Edge Function)
-- consegue ler ou escrever aqui, nem o próprio admin logado no app.
