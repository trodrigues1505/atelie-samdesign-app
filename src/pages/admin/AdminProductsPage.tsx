import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productRepository, type ProductWithVariants } from "@/repositories/productRepository";
import { formatBRL } from "@/pages/client/ShopPage";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
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
      alert(err instanceof Error ? err.message : "Erro ao atualizar produto.");
    }
  }

  async function handleDelete(product: ProductWithVariants) {
    if (!window.confirm(`Excluir "${product.nome}" definitivamente?`)) return;
    try {
      await productRepository.remove(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir produto.");
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Link
          to="/admin/produtos/novo"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          + Novo produto
        </Link>
      </div>

      {loading && <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Produto</th>
                <th className="px-4 py-2 font-medium">Categoria</th>
                <th className="px-4 py-2 font-medium">Preço</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-2">{p.nome}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.categoria}</td>
                  <td className="px-4 py-2">{formatBRL(p.preco)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        p.ativo
                          ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/produtos/${p.id}`}
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium transition hover:bg-muted"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleToggleAtivo(p)}
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium transition hover:bg-muted"
                      >
                        {p.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum produto cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
