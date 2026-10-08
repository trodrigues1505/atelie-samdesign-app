import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Minus, Package, Plus, Trash2, X } from "lucide-react";
import { productRepository, type ProductWithVariants } from "@/repositories/productRepository";
import type { ProductVariant } from "@/types/database";
import { Badge } from "@/components/ds/Badge";
import { EmptyState } from "@/components/ds/EmptyState";
import { ErrorState } from "@/components/ds/ErrorState";
import { Field } from "@/components/ds/Field";
import { useFeedback } from "@/components/ds/Feedback";
import { PageHeader } from "@/components/ds/PageHeader";
import { Section } from "@/components/ds/Section";
import { Skeleton } from "@/components/ds/Skeleton";
import { Switch } from "@/components/ds/Switch";

const TAMANHOS_PADRAO = ["1", "2", "4", "6", "8", "10"];

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { toast, confirm } = useFeedback();

  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [pesoGramas, setPesoGramas] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [ativo, setAtivo] = useState(true);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    productRepository
      .getById(id)
      .then((p) => {
        if (!active) return;
        if (!p) {
          setNotFound(true);
          return;
        }
        setProduct(p);
        setNome(p.nome);
        setDescricao(p.descricao);
        setCategoria(p.categoria);
        setPreco(String(p.preco));
        setPesoGramas(String(p.peso_gramas));
        setFotos(p.fotos ?? []);
        setAtivo(p.ativo);
        setVariants(p.product_variants ?? []);
      })
      .catch((err) => {
        if (active) setLoadError(err instanceof Error ? err.message : "Erro ao carregar produto.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);

  async function handleUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !product) return;
    setUploading(true);
    try {
      const url = await productRepository.uploadPhoto(product.id, file);
      const novasFotos = [...fotos, url];
      await productRepository.update(product.id, { fotos: novasFotos });
      setFotos(novasFotos);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao enviar foto.", "error");
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  async function handleRemovePhoto(url: string) {
    if (!product) return;
    const ok = await confirm({
      title: "Remover esta foto?",
      confirmLabel: "Remover",
      destructive: true,
    });
    if (!ok) return;
    const anteriores = fotos;
    const novasFotos = fotos.filter((f) => f !== url);
    setFotos(novasFotos);
    try {
      await productRepository.update(product.id, { fotos: novasFotos });
    } catch (err) {
      setFotos(anteriores);
      toast(err instanceof Error ? err.message : "Erro ao remover foto.", "error");
    }
  }

  async function handleSave() {
    const precoNum = Number(preco);
    const pesoNum = Number(pesoGramas);
    if (!nome.trim()) return setError("Informe o nome do produto.");
    if (!preco.trim() || !Number.isFinite(precoNum) || precoNum <= 0) {
      return setError("Informe um preço maior que zero.");
    }
    // O peso entra no cálculo do frete; vazio viraria 0 g sem aviso.
    if (!pesoGramas.trim() || !Number.isFinite(pesoNum) || pesoNum <= 0) {
      return setError("Informe o peso em gramas (maior que zero) para calcular o frete.");
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        nome,
        descricao,
        categoria,
        preco: precoNum,
        peso_gramas: pesoNum,
        fotos,
        ativo,
      };

      if (isEditing && product) {
        await productRepository.update(product.id, payload);
        toast("Produto salvo.", "success");
        navigate("/admin/produtos");
      } else {
        const created = await productRepository.create(payload);
        // Após criar, permanece na tela em modo edição para permitir
        // anexar fotos e cadastrar variações.
        toast("Produto criado. Agora adicione fotos e tamanhos.", "success");
        navigate(`/admin/produtos/${created.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddVariant(tamanho: string) {
    if (!product) return;
    try {
      const created = await productRepository.createVariant({
        product_id: product.id,
        tamanho,
        cor: null,
        tecido: null,
        estoque: 1,
      });
      setVariants((prev) => [...prev, created]);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao cadastrar variação.", "error");
    }
  }

  async function handleUpdateVariantStock(variantId: string, estoque: number) {
    try {
      const updated = await productRepository.updateVariant(variantId, { estoque });
      setVariants((prev) => prev.map((v) => (v.id === variantId ? updated : v)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao atualizar estoque.", "error");
    }
  }

  async function handleRemoveVariant(variant: ProductVariant) {
    const ok = await confirm({
      title: `Remover o tamanho ${variant.tamanho}?`,
      confirmLabel: "Remover",
      destructive: true,
    });
    if (!ok) return;
    try {
      await productRepository.removeVariant(variant.id);
      setVariants((prev) => prev.filter((v) => v.id !== variant.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao remover variação.", "error");
    }
  }

  const title = isEditing ? "Editar produto" : "Novo produto";

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-6 h-96" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <ErrorState
          title="Não foi possível carregar o produto"
          message={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <EmptyState
          icon={Package}
          title="Produto não encontrado"
          description="Ele pode ter sido excluído."
          action={
            <Link to="/admin/produtos" className="btn btn-primary">
              Voltar aos produtos
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title={title} backTo="/admin/produtos" backLabel="Produtos" />

      <div className="mt-6 flex flex-col gap-4">
        <Section title="Informações">
          <div className="flex flex-col gap-4">
            <Field label="Nome">
              <input value={nome} onChange={(e) => setNome(e.target.value)} className="input" />
            </Field>

            <Field label="Descrição">
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="input"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria">
                <input value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input" />
              </Field>
              <Field label="Preço (R$)">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Peso (gramas)" hint="Usado para calcular o frete.">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={pesoGramas}
                onChange={(e) => setPesoGramas(e.target.value)}
                className="input sm:max-w-xs"
              />
            </Field>

            <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/60 p-3.5">
              <div>
                <p className="text-sm font-medium">Visível na loja</p>
                <p className="text-sm text-muted-foreground">
                  {ativo ? "Os clientes podem ver e comprar." : "Escondido dos clientes."}
                </p>
              </div>
              <Switch checked={ativo} onChange={setAtivo} label="Produto visível na loja" />
            </div>
          </div>
        </Section>

        {error && (
          <p role="alert" className="rounded-xl bg-destructive-soft px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div>
          <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary w-full sm:w-auto">
            {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar produto"}
          </button>
        </div>

        {isEditing && product ? (
          <>
            <Section title="Fotos" description="A primeira foto é a capa na loja.">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {fotos.map((url, index) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    {index === 0 && (
                      <span className="absolute bottom-1.5 left-1.5">
                        <Badge tone="primary">Capa</Badge>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(url)}
                      aria-label="Remover foto"
                      className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition-colors hover:bg-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  {uploading ? "Enviando..." : "Foto"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    className="sr-only"
                    onChange={handleUploadPhoto}
                  />
                </label>
              </div>
            </Section>

            <Section title="Tamanhos e estoque">
              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum tamanho cadastrado. Adicione abaixo para o cliente poder escolher.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {variants.map((v) => (
                    <VariantRow
                      key={v.id}
                      variant={v}
                      onStockChange={handleUpdateVariantStock}
                      onRemove={handleRemoveVariant}
                    />
                  ))}
                </ul>
              )}

              {TAMANHOS_PADRAO.some((t) => !variants.some((v) => v.tamanho === t)) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {TAMANHOS_PADRAO.filter((t) => !variants.some((v) => v.tamanho === t)).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAddVariant(t)}
                      className="btn btn-sm btn-secondary"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Tamanho {t}
                    </button>
                  ))}
                </div>
              )}
            </Section>
          </>
        ) : (
          <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            Depois de criar o produto, você poderá adicionar fotos e tamanhos.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Linha de tamanho com estoque. O número digitado só é enviado ao sair do
 * campo (ou ao usar − / +): enviar a cada tecla disparava uma requisição por
 * dígito e as respostas podiam chegar fora de ordem.
 */
function VariantRow({
  variant,
  onStockChange,
  onRemove,
}: {
  variant: ProductVariant;
  onStockChange: (variantId: string, estoque: number) => void;
  onRemove: (variant: ProductVariant) => void;
}) {
  const [draft, setDraft] = useState(String(variant.estoque));

  useEffect(() => {
    setDraft(String(variant.estoque));
  }, [variant.estoque]);

  function commit(value: number) {
    const estoque = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    setDraft(String(estoque));
    if (estoque !== variant.estoque) onStockChange(variant.id, estoque);
  }

  return (
    <li className="flex items-center gap-3 rounded-xl bg-muted/60 p-2.5 pl-4">
      <span className="min-w-14 font-medium">Tam. {variant.tamanho}</span>

      <div className="ml-auto inline-flex items-center rounded-full border border-border bg-card">
        <button
          type="button"
          aria-label={`Diminuir estoque do tamanho ${variant.tamanho}`}
          onClick={() => commit(variant.estoque - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          aria-label={`Estoque do tamanho ${variant.tamanho}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(Number(draft))}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-12 bg-transparent text-center text-base font-medium tabular-nums outline-none [appearance:textfield] sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`Aumentar estoque do tamanho ${variant.tamanho}`}
          onClick={() => commit(variant.estoque + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onRemove(variant)}
        aria-label={`Remover tamanho ${variant.tamanho}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}
