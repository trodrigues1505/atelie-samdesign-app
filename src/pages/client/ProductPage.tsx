import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, ImageOff, Minus, Plus, ShoppingBag } from "lucide-react";
import { productRepository, type ProductWithVariants } from "@/repositories/productRepository";
import { useCart } from "@/contexts/CartContext";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ds/EmptyState";
import { ErrorState } from "@/components/ds/ErrorState";
import { Skeleton } from "@/components/ds/Skeleton";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);
    productRepository
      .getById(id)
      .then((p) => {
        if (!active) return;
        setProduct(p);
        // Começa em um tamanho com estoque; o primeiro da lista pode estar esgotado.
        const first = p?.product_variants?.find((v) => v.estoque > 0) ?? p?.product_variants?.[0];
        setVariantId(first?.id ?? null);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Erro ao carregar produto.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);

  useEffect(() => () => window.clearTimeout(addedTimer.current), []);

  if (loading) {
    return (
      <div className="grid gap-8 px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-2">
        <Skeleton className="aspect-[4/5] rounded-2xl" />
        <div>
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="mt-3 h-7 w-32" />
          <Skeleton className="mt-6 h-24" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <ErrorState
          title="Não foi possível carregar o produto"
          message={error}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <EmptyState
          icon={ShoppingBag}
          title="Produto não encontrado"
          description="Ele pode ter saído da loja."
          action={
            <Link to="/loja" className="btn btn-primary">
              Voltar para a loja
            </Link>
          }
        />
      </div>
    );
  }

  const variants = product.product_variants;
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const semEstoque = variant ? variant.estoque <= 0 : false;
  // Sem variação cadastrada não há estoque a respeitar; com ela, não passa do que existe.
  const maxQuantidade = variant ? Math.max(variant.estoque, 1) : 99;
  const fotos = product.fotos ?? [];

  function selectVariant(next: string) {
    setVariantId(next);
    const nextVariant = variants.find((v) => v.id === next);
    if (nextVariant) setQuantidade((q) => Math.min(q, Math.max(nextVariant.estoque, 1)));
  }

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
    window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-8 md:grid-cols-2 md:gap-10">
        <div>
          <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted">
            {fotos[photoIndex] ? (
              <img src={fotos[photoIndex]} alt={product.nome} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImageOff className="h-8 w-8" aria-hidden="true" />
                <span className="sr-only">Sem foto</span>
              </div>
            )}
          </div>

          {fotos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {fotos.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setPhotoIndex(index)}
                  aria-label={`Ver foto ${index + 1}`}
                  aria-pressed={index === photoIndex}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                    index === photoIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Link to="/loja" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Voltar para a loja
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{product.nome}</h1>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatBRL(product.preco)}</p>
          {product.descricao && (
            <p className="mt-4 whitespace-pre-line text-muted-foreground">{product.descricao}</p>
          )}

          {variants.length > 0 && (
            <div className="mt-6">
              <p id="tamanho-label" className="text-sm font-medium">
                Tamanho
              </p>
              <div role="group" aria-labelledby="tamanho-label" className="mt-2 flex flex-wrap gap-2">
                {variants.map((v) => {
                  const esgotado = v.estoque <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={esgotado}
                      aria-pressed={v.id === variantId}
                      onClick={() => selectVariant(v.id)}
                      className={cn(
                        "min-h-11 min-w-12 rounded-xl border px-4 text-sm font-medium transition-colors",
                        v.id === variantId
                          ? "border-primary bg-primary-soft text-primary-ink"
                          : "border-border bg-card hover:bg-muted",
                        esgotado && "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:bg-card"
                      )}
                    >
                      {v.tamanho}
                      {v.cor ? ` — ${v.cor}` : ""}
                      {esgotado && <span className="sr-only"> (sem estoque)</span>}
                    </button>
                  );
                })}
              </div>
              {variant && !semEstoque && variant.estoque <= 3 && (
                <p className="mt-2 text-sm text-warning">
                  {variant.estoque === 1 ? "Resta 1 unidade" : `Restam ${variant.estoque} unidades`}
                </p>
              )}
            </div>
          )}

          <div className="mt-6">
            <p id="quantidade-label" className="text-sm font-medium">
              Quantidade
            </p>
            <div
              role="group"
              aria-labelledby="quantidade-label"
              className="mt-2 inline-flex items-center rounded-full border border-border bg-card"
            >
              <button
                type="button"
                aria-label="Diminuir quantidade"
                disabled={quantidade <= 1}
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span aria-live="polite" className="w-10 text-center font-medium tabular-nums">
                {quantidade}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                disabled={quantidade >= maxQuantidade}
                onClick={() => setQuantidade((q) => Math.min(maxQuantidade, q + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={semEstoque}
              className="btn btn-primary h-12 sm:h-12 sm:px-6"
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Adicionado
                </>
              ) : semEstoque ? (
                "Sem estoque"
              ) : (
                "Adicionar ao carrinho"
              )}
            </button>
            <Link to="/carrinho" className="btn btn-secondary h-12 sm:h-12 sm:px-6">
              Ver carrinho
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
