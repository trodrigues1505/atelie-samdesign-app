import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { productRepository, type ProductWithVariants } from "@/repositories/productRepository";
import type { ProductVariant } from "@/types/database";

const TAMANHOS_PADRAO = ["1", "2", "4", "6", "8", "10"];

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    productRepository.getById(id).then((p) => {
      if (!p) return;
      setProduct(p);
      setNome(p.nome);
      setDescricao(p.descricao);
      setCategoria(p.categoria);
      setPreco(String(p.preco));
      setPesoGramas(String(p.peso_gramas));
      setFotos(p.fotos ?? []);
      setAtivo(p.ativo);
      setVariants(p.product_variants ?? []);
      setLoading(false);
    });
  }, [id]);

  async function handleUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !product) {
      alert("Salve o produto primeiro para poder anexar fotos.");
      return;
    }
    setUploading(true);
    try {
      const url = await productRepository.uploadPhoto(product.id, file);
      const novasFotos = [...fotos, url];
      setFotos(novasFotos);
      await productRepository.update(product.id, { fotos: novasFotos });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemovePhoto(url: string) {
    if (!product) return;
    const novasFotos = fotos.filter((f) => f !== url);
    setFotos(novasFotos);
    await productRepository.update(product.id, { fotos: novasFotos });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        nome,
        descricao,
        categoria,
        preco: Number(preco),
        peso_gramas: Number(pesoGramas),
        fotos,
        ativo,
      };

      if (isEditing && product) {
        await productRepository.update(product.id, payload);
        navigate("/admin/produtos");
      } else {
        const created = await productRepository.create(payload);
        // Após criar, permanece na tela em modo edição para permitir
        // anexar fotos e cadastrar variações.
        navigate(`/admin/produtos/${created.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddVariant(tamanho: string) {
    if (!product) {
      alert("Salve o produto primeiro para poder cadastrar variações.");
      return;
    }
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
      alert(err instanceof Error ? err.message : "Erro ao cadastrar variação.");
    }
  }

  async function handleUpdateVariantStock(variantId: string, estoque: number) {
    try {
      const updated = await productRepository.updateVariant(variantId, { estoque });
      setVariants((prev) => prev.map((v) => (v.id === variantId ? updated : v)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar estoque.");
    }
  }

  async function handleRemoveVariant(variantId: string) {
    try {
      await productRepository.removeVariant(variantId);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao remover variação.");
    }
  }

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">{isEditing ? "Editar produto" : "Novo produto"}</h1>

      <div className="mt-6 flex flex-col gap-4">
        <Field label="Nome">
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="input" />
        </Field>

        <Field label="Descrição">
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoria">
            <input value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input" />
          </Field>
          <Field label="Preço (R$)">
            <input
              type="number"
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Peso (gramas)">
          <input
            type="number"
            value={pesoGramas}
            onChange={(e) => setPesoGramas(e.target.value)}
            className="input max-w-xs"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Produto ativo (visível na loja)
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar produto"}
        </button>
      </div>

      {isEditing && product && (
        <>
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Fotos</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {fotos.map((url) => (
                <div key={url} className="relative h-24 w-24 overflow-hidden rounded-md border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => handleRemovePhoto(url)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground hover:bg-muted">
                {uploading ? "Enviando..." : "+ Foto"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
              </label>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Variações (tamanho / estoque)</h2>
            <div className="mt-3 flex flex-col gap-2">
              {variants.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-md border border-border p-2 text-sm">
                  <span className="w-16 font-medium">{v.tamanho}</span>
                  <input
                    type="number"
                    min={0}
                    value={v.estoque}
                    onChange={(e) => handleUpdateVariantStock(v.id, Number(e.target.value))}
                    className="input w-20"
                  />
                  <span className="text-xs text-muted-foreground">em estoque</span>
                  <button
                    onClick={() => handleRemoveVariant(v.id)}
                    className="ml-auto text-xs text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {TAMANHOS_PADRAO.filter((t) => !variants.some((v) => v.tamanho === t)).map((t) => (
                <button
                  key={t}
                  onClick={() => handleAddVariant(t)}
                  className="rounded-md border border-border px-3 py-1 text-xs transition hover:bg-muted"
                >
                  + Tamanho {t}
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
