import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ImageOff, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { productRepository, type ProductWithVariants } from "@/repositories/productRepository";
import { formatBRL } from "@/lib/format";
import { Badge } from "@/components/ds/Badge";
import { EmptyState } from "@/components/ds/EmptyState";
import { ErrorState } from "@/components/ds/ErrorState";
import { useFeedback } from "@/components/ds/Feedback";
import { PageHeader } from "@/components/ds/PageHeader";
import { Skeleton } from "@/components/ds/Skeleton";
import { Switch } from "@/components/ds/Switch";

export default function AdminProductsPage() {
  const { toast, confirm } = useFeedback();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const data = await productRepository.listAllAdmin();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleAtivo(product: ProductWithVariants) {
    try {
      await productRepository.update(product.id, { ativo: !product.ativo });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, ativo: !p.ativo } : p))
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao atualizar produto.", "error");
    }
  }

  async function handleDelete(product: ProductWithVariants) {
    const ok = await confirm({
      title: `Excluir "${product.nome}"?`,
      description: "O produto é removido definitivamente. Essa ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (!ok) return;
    try {
      await productRepository.remove(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast("Produto excluído.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir produto.", "error");
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Produtos"
        description={loading || error ? undefined : `${products.length} cadastrados`}
        actions={
          <Link to="/admin/produtos/novo" className="btn btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo produto
          </Link>
        }
      />

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : error ? (
          <ErrorState title="Não foi possível carregar os produtos" message={error} onRetry={loadProducts} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto cadastrado ainda"
            description="Cadastre o primeiro produto para ele aparecer na loja."
            action={
              <Link to="/admin/produtos/novo" className="btn btn-primary">
                Novo produto
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {products.map((p) => {
              const variants = p.product_variants ?? [];
              const estoque = variants.reduce((sum, v) => sum + v.estoque, 0);
              return (
                <li key={p.id} className="card flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-20">
                    {p.fotos?.[0] ? (
                      <img src={p.fotos[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageOff className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate font-medium">{p.nome}</p>
                      {!p.ativo && <Badge>Inativo</Badge>}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{p.categoria}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">{formatBRL(p.preco)}</span>
                      <Badge tone={variants.length === 0 || estoque === 0 ? "warning" : "neutral"}>
                        {variants.length === 0 ? "Sem tamanhos" : `Estoque: ${estoque}`}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Switch
                      checked={p.ativo}
                      onChange={() => handleToggleAtivo(p)}
                      label={`${p.ativo ? "Desativar" : "Ativar"} ${p.nome}`}
                    />
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/produtos/${p.id}`} className="btn btn-sm btn-secondary">
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        aria-label={`Excluir ${p.nome}`}
                        className="btn btn-sm btn-ghost w-10 px-0 hover:bg-destructive-soft hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
