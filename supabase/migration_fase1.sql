-- ============================================================
-- Fase 1 — Loja e pedidos
-- Execute este arquivo no SQL Editor do Supabase DEPOIS do schema.sql
-- ============================================================

-- Quando um pedido é criado, o cliente (via app) não tem permissão de
-- escrever na tabela `production` (só admin, pela RLS) — então o primeiro
-- registro da linha do tempo ("recebido") é criado automaticamente aqui,
-- via trigger com `security definer`, que roda com privilégios elevados
-- e ignora a RLS só para esta inserção específica.

create or replace function public.handle_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.production (order_id, etapa, responsavel, observacao)
  values (new.id, 'recebido', 'sistema', 'Pedido recebido automaticamente.');
  return new;
end;
$$;

drop trigger if exists trg_new_order on public.orders;

create trigger trg_new_order
  after insert on public.orders
  for each row
  execute function public.handle_new_order();
