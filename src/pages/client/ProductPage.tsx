import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { productRepository, type ProductWithVariants } from "@/repositories/productRepository";
import { useCart } from "@/contexts/CartContext";
import { formatBRL } from "@/pages/client/ShopPage";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    productRepository
      .getById(id)
      .then((p) => {
        setProduct(p);
        if (p?.product_variants?.[0]) setVariantId(p.product_variants[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar produto."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Carregando...</p>;
  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!product) return <p className="p-6 text-sm text-muted-foreground">Produto não encontrado.</p>;

  const variant = product.product_variants.find((v) => v.id === variantId) ?? null;
  const semEstoque = variant ? variant.estoque <= 0 : false;

  function handleAddToCart() {
    if (!product) return;
    addItem({
      productId: product.id,
      variantId: variant?.id ?? null,
      nome: product.nome,
      foto: product.fotos?.[0] ?? null,
      tamanho: variant?.tamanho ?? null,
      cor: variant?.cor ?? null,
      preco: product.preco,
      pesoGramas: product.peso_gramas,
      quantidade,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="grid gap-8 p-6 sm:grid-cols-2">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {product.fotos?.[0] ? (
          <img src={product.fotos[0]} alt={product.nome} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem foto
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold">{product.nome}</h1>
        <p className="mt-2 text-xl font-semibold text-primary">{formatBRL(product.preco)}</p>
        <p className="mt-4 text-sm text-muted-foreground">{product.descricao}</p>

        {product.product_variants.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium">Tamanho / opção</label>
            <select
              value={variantId ?? ""}
              onChange={(e) => setVariantId(e.target.value)}
              className="mt-1 block w-full max-w-xs rounded-md border border-border px-3 py-2 text-sm"
            >
              {product.product_variants.map((v) => (
                <option key={v.id} value={v.id} disabled={v.estoque <= 0}>
                  {v.tamanho}
                  {v.cor ? ` — ${v.cor}` : ""}
                  {v.estoque <= 0 ? " (sem estoque)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm font-medium">Quantidade</label>
          <input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
            className="w-20 rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={semEstoque}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {added ? "Adicionado ✓" : semEstoque ? "Sem estoque" : "Adicionar ao carrinho"}
          </button>
          <button
            onClick={() => navigate("/carrinho")}
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
          >
            Ver carrinho
          </button>
        </div>
      </div>
    </div>
  );
}
