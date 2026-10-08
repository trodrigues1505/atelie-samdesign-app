import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ImageOff, Search, SearchX, ShoppingBag, TriangleAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { productRepository, type ProductWithVariants } from "@/repositories/productRepository";
import { formatBRL } from "@/lib/format";
import { EmptyState } from "@/components/ds/EmptyState";
import { Skeleton } from "@/components/ds/Skeleton";
import { cn } from "@/lib/cn";

export default function ShopPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    productRepository
      .listActive()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Erro ao carregar produtos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const categorias = useMemo(() => {
    const set = new Set(
      products.map((p) => p.categoria).filter((c): c is string => Boolean(c))
    );
    return ["todas", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = p.nome.toLowerCase().includes(term);
      const matchesCategoria = categoria === "todas" || p.categoria === categoria;
      return matchesSearch && matchesCategoria;
    });
  }, [products, search, categoria]);

  function clearFilters() {
    setSearch("");
    setCategoria("todas");
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Loja</h1>

      <div className="mt-5 flex flex-col gap-3">
        <div className="relative sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Buscar produto"
            placeholder="Buscar produto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full pl-10"
          />
        </div>

        {categorias.length > 1 && (
          <div
            role="group"
            aria-label="Categorias"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={categoria === c}
                onClick={() => setCategoria(c)}
                className={cn(
                  "min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                  categoria === c
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {c === "todas" ? "Todas" : c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/5] rounded-2xl" />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card flex flex-col items-center px-6 py-10 text-center">
            <TriangleAlert className="h-6 w-6 text-warning" aria-hidden="true" />
            <p className="mt-3 font-medium">Não foi possível carregar os produtos</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="btn btn-secondary mt-5"
            >
              Tentar de novo
            </button>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="A loja ainda não tem produtos"
            description={
              user?.role === "admin"
                ? "Cadastre produtos no painel admin ou rode supabase/seed.sql para inserir exemplos."
                : "Volte em breve para ver as novidades."
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nenhum produto encontrado"
            description="Tente outra busca ou outra categoria."
            action={
              <button type="button" onClick={clearFilters} className="btn btn-secondary">
                Limpar filtros
              </button>
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4">
            {filtered.map((product) => (
              <li key={product.id}>
                <Link to={`/loja/${product.id}`} className="group block">
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                    {product.fotos?.[0] ? (
                      <img
                        src={product.fotos[0]}
                        alt={product.nome}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageOff className="h-6 w-6" aria-hidden="true" />
                        <span className="sr-only">Sem foto</span>
                      </div>
                    )}
                  </div>
                  <div className="px-1 pt-3">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{product.nome}</p>
                    <p className="mt-1 font-semibold tabular-nums">{formatBRL(product.preco)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
