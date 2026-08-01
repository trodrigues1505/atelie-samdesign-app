import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productRepository, type ProductWithVariants } from "@/repositories/productRepository";

export default function ShopPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");

  useEffect(() => {
    productRepository
      .listActive()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar produtos."))
      .finally(() => setLoading(false));
  }, []);

  const categorias = useMemo(() => {
    const set = new Set(products.map((p) => p.categoria).filter(Boolean));
    return ["todas", ...Array.from(set)];
  }, [products]);

  const filtered = products.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchesCategoria = categoria === "todas" || p.categoria === categoria;
    return matchesSearch && matchesCategoria;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Loja</h1>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm sm:max-w-xs"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm sm:max-w-xs"
        >
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c === "todas" ? "Todas as categorias" : c}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="mt-6 text-sm text-muted-foreground">Carregando produtos...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhum produto encontrado. Cadastre produtos no painel admin (Fase 3) ou rode o{" "}
          <code>supabase/seed.sql</code> para inserir alguns de exemplo.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((product) => (
          <Link
            key={product.id}
            to={`/loja/${product.id}`}
            className="group overflow-hidden rounded-lg border border-border transition hover:shadow-md"
          >
            <div className="aspect-square w-full bg-muted">
              {product.fotos?.[0] ? (
                <img
                  src={product.fotos[0]}
                  alt={product.nome}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Sem foto
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium leading-tight">{product.nome}</p>
              <p className="mt-1 text-sm font-semibold text-primary">
                {formatBRL(product.preco)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
