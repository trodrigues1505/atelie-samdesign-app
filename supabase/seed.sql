-- ============================================================
-- Produtos de exemplo (opcional) — só pra você testar a loja
-- sem precisar esperar o CRUD de produtos (Fase 3) ficar pronto.
-- Execute no SQL Editor do Supabase se quiser ver a loja com itens.
-- Sem fotos reais ainda — os cards vão aparecer com "Sem foto"
-- até você subir imagens de verdade (isso entra na Fase 3).
-- ============================================================

insert into public.products (nome, descricao, categoria, preco, peso_gramas, fotos, ativo)
values
  ('Vestido Elsa Frozen', 'Vestido temático inspirado na Elsa, de Frozen.', 'Vestido Temático', 450.00, 350, '{}', true),
  ('Vestido Patrulha Canina Skye', 'Vestido temático inspirado na Skye, da Patrulha Canina.', 'Vestido Temático', 320.00, 320, '{}', true),
  ('Fantasia Homem Aranha Infantil', 'Fantasia completa do Homem-Aranha para crianças.', 'Fantasia', 350.00, 300, '{}', true),
  ('Vestido Festa Junina Xadrez', 'Vestido de festa junina em tecido xadrez com babados.', 'Festa Junina', 350.00, 400, '{}', true),
  ('Macacão Hotwheels', 'Macacão temático inspirado em Hot Wheels.', 'Fantasia', 280.00, 350, '{}', true)
on conflict do nothing;

-- Variações de tamanho para cada produto acima (1 a 10 anos)
insert into public.product_variants (product_id, tamanho, cor, tecido, estoque)
select p.id, tamanho, null, null, 3
from public.products p
cross join (values ('1'), ('2'), ('4'), ('6'), ('8'), ('10')) as sizes(tamanho)
where p.nome in (
  'Vestido Elsa Frozen',
  'Vestido Patrulha Canina Skye',
  'Fantasia Homem Aranha Infantil',
  'Vestido Festa Junina Xadrez',
  'Macacão Hotwheels'
)
on conflict do nothing;
