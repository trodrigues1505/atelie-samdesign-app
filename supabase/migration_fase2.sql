-- ============================================================
-- Fase 2 — Timeline do pedido e Notificações
-- Execute no SQL Editor do Supabase DEPOIS de schema.sql e migration_fase1.sql
-- ============================================================

-- Sempre que uma linha é inserida em `production` (seja pelo trigger da
-- Fase 1 no momento do pedido, seja futuramente pelo admin avançando as
-- etapas no painel — Fase 3), uma notificação é criada automaticamente
-- para o dono do pedido. Assim a tabela `notifications` nunca fica
-- desatualizada em relação à produção real, e o admin não precisa lembrar
-- de notificar manualmente a cada mudança de etapa.

create or replace function public.notify_production_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_titulo text;
begin
  select user_id into v_user_id from public.orders where id = new.order_id;

  v_titulo := case new.etapa
    when 'recebido'     then 'Pedido recebido'
    when 'modelagem'    then 'Seu pedido entrou em modelagem'
    when 'corte'        then 'Seu pedido está sendo cortado'
    when 'costura'      then 'Seu pedido está sendo costurado'
    when 'acabamento'   then 'Seu pedido está no acabamento'
    when 'conferencia'  then 'Seu pedido está em conferência de qualidade'
    when 'pronto'       then 'Seu pedido está pronto!'
    when 'envio'        then 'Seu pedido foi enviado'
    else 'Atualização no seu pedido'
  end;

  insert into public.notifications (user_id, titulo, mensagem)
  values (v_user_id, v_titulo, coalesce(new.observacao, 'Etapa atual: ' || new.etapa));

  return new;
end;
$$;

drop trigger if exists trg_notify_production on public.production;

create trigger trg_notify_production
  after insert on public.production
  for each row
  execute function public.notify_production_change();

-- Habilita Realtime na tabela `notifications`, necessário para o sino de
-- notificações no app atualizar sozinho, sem precisar recarregar a página.
alter publication supabase_realtime add table public.notifications;
