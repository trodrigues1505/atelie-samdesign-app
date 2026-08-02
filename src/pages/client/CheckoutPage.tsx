import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { addressSchema, type AddressFormValues } from "@/schemas/checkoutSchema";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { orderRepository } from "@/repositories/orderRepository";
import { calculateFrete } from "@/services/shippingService";
import { shippingProvider } from "@/services/shipping/CorreiosProvider";
import type { FreightQuote } from "@/types/shipping";
import { formatBRL } from "@/pages/client/ShopPage";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, totalWeightGramas, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [quotes, setQuotes] = useState<FreightQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [selectedServico, setSelectedServico] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: user?.endereco ?? undefined,
  });

  const cep = watch("cep");

  // Busca o frete real nos Correios sempre que o CEP tiver 8 dígitos.
  // Se a Edge Function ainda não estiver publicada (ou der erro), cai
  // para o cálculo provisório por peso, sem travar o checkout.
  useEffect(() => {
    const cepLimpo = (cep ?? "").replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      setQuotes([]);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setQuotesLoading(true);
      setQuotesError(null);
      try {
        const result = await shippingProvider.calcularFrete({
          cepDestino: cepLimpo,
          pesoGramas: totalWeightGramas,
        });
        if (!cancelled) {
          setQuotes(result);
          setSelectedServico(result[0]?.servico ?? null);
        }
      } catch {
        if (!cancelled) {
          setQuotesError(
            "Não foi possível calcular o frete pelos Correios agora — usando estimativa provisória."
          );
          setQuotes([]);
        }
      } finally {
        if (!cancelled) setQuotesLoading(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [cep, totalWeightGramas]);

  const quoteSelecionada = quotes.find((q) => q.servico === selectedServico);
  const frete = quoteSelecionada?.valor ?? calculateFrete(totalWeightGramas);

  if (items.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Seu carrinho está vazio — volte à loja para adicionar produtos.
        </p>
      </div>
    );
  }

  async function onSubmit(values: AddressFormValues) {
    if (!user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await orderRepository.create({
        userId: user.id,
        items,
        endereco: values,
        subtotal,
        frete,
      });
      clear();
      navigate(`/pedido/${order.id}`, { replace: true, state: { justCreated: true } });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Erro ao finalizar o pedido. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 p-6 sm:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Endereço de entrega</h1>

        <Field label="CEP" error={errors.cep?.message}>
          <input {...register("cep")} placeholder="00000-000" className="input" />
        </Field>

        <Field label="Rua / Avenida" error={errors.logradouro?.message}>
          <input {...register("logradouro")} className="input" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Número" error={errors.numero?.message}>
            <input {...register("numero")} className="input" />
          </Field>
          <Field label="Complemento">
            <input {...register("complemento")} className="input" />
          </Field>
        </div>

        <Field label="Bairro" error={errors.bairro?.message}>
          <input {...register("bairro")} className="input" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Cidade" error={errors.cidade?.message}>
            <input {...register("cidade")} className="input" />
          </Field>
          <Field label="UF" error={errors.uf?.message}>
            <input {...register("uf")} maxLength={2} className="input uppercase" />
          </Field>
        </div>

        {quotes.length > 0 && (
          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            <p className="text-sm font-medium">Escolha o envio</p>
            {quotes.map((q) => (
              <label key={q.servico} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="servico"
                  checked={selectedServico === q.servico}
                  onChange={() => setSelectedServico(q.servico)}
                />
                {q.nome} — {formatBRL(q.valor)} ({q.prazoDias} dias úteis)
              </label>
            ))}
          </div>
        )}

        {quotesLoading && <p className="text-xs text-muted-foreground">Calculando frete...</p>}
        {quotesError && <p className="text-xs text-muted-foreground">{quotesError}</p>}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Finalizando..." : "Confirmar pedido"}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold">Resumo do pedido</h2>
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border p-4 text-sm">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId}`} className="flex justify-between">
              <span>
                {item.quantidade}x {item.nome}
                {item.tamanho ? ` (${item.tamanho})` : ""}
              </span>
              <span>{formatBRL(item.preco * item.quantidade)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Frete {quoteSelecionada ? `(${quoteSelecionada.nome})` : "(estimativa)"}
            </span>
            <span>{formatBRL(frete)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatBRL(subtotal + frete)}</span>
          </div>
        </div>
        {!quoteSelecionada && (
          <p className="mt-2 text-xs text-muted-foreground">
            Preencha o CEP para calcular o frete real pelos Correios.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      {children}
      {error && <span className="text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}
