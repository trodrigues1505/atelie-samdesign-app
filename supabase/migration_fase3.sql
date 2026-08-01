-- ============================================================
-- Fase 3 — Painel admin (produtos, pedidos, produção)
-- Execute no SQL Editor do Supabase DEPOIS das migrations anteriores
-- ============================================================

-- Bucket público de fotos de produtos (leitura livre, já que é uma loja;
-- escrita restrita a administradores).
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "product_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'product-photos');

create policy "product_photos_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'product-photos' and public.is_admin());

create policy "product_photos_admin_update"
  on storage.objects for update
  using (bucket_id = 'product-photos' and public.is_admin());

create policy "product_photos_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'product-photos' and public.is_admin());
