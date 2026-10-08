import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { addressSchema, type AddressFormValues } from "@/schemas/checkoutSchema";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { orderRepository } from "@/repositories/orderRepository";
import { calculateFrete } from "@/services/shippingService";
import { shippingProvider } from "@/services/shipping";
import type { FreightQuote } from "@/types/shipping";
import { formatBRL } from "@/lib/format";
import { EmptyState } from "@/components/ds/EmptyState";
import { Field } from "@/components/ds/Field";
import { PageHeader } from "@/components/ds/PageHeader";
import { Section } from "@/components/ds/Section";
import { Skeleton } from "@/components/ds/Skeleton";

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
      // Zera também o carregando/erro: se o CEP deixa de ser válido no meio de uma
      // consulta, o resultado é descartado e "Calculando frete..." ficaria preso.
      setQuotes([]);
      setQuotesLoading(false);
      setQuotesError(null);
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
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader title="Checkout" />
        <EmptyState
          className="mt-6"
          icon={ShoppingCart}
          title="Seu carrinho está vazio"
          description="Volte à loja para adicionar produtos."
          action={
            <Link to="/loja" className="btn btn-primary">
              Ir para a loja
            </Link>
          }
        />
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8"
    >
      <div className="flex flex-col gap-4">
        <PageHeader title="Finalizar pedido" backTo="/carrinho" backLabel="Carrinho" />

        <Section title="Endereço de entrega" className="mt-2">
          <div className="flex flex-col gap-4">
            <Field label="CEP" error={errors.cep?.message}>
              <input
                {...register("cep")}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                aria-invalid={Boolean(errors.cep)}
                className="input sm:max-w-48"
              />
            </Field>

            <Field label="Rua / Avenida" error={errors.logradouro?.message}>
              <input
                {...register("logradouro")}
                autoComplete="address-line1"
                aria-invalid={Boolean(errors.logradouro)}
                className="input"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Número" error={errors.numero?.message}>
                <input
                  {...register("numero")}
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.numero)}
                  className="input"
                />
              </Field>
              <Field label="Complemento">
                <input {...register("complemento")} autoComplete="address-line2" className="input" />
              </Field>
            </div>

            <Field label="Bairro" error={errors.bairro?.message}>
              <input
                {...register("bairro")}
                aria-invalid={Boolean(errors.bairro)}
                className="input"
              />
            </Field>

            <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-4">
              <Field label="Cidade" error={errors.cidade?.message}>
                <input
                  {...register("cidade")}
                  autoComplete="address-level2"
                  aria-invalid={Boolean(errors.cidade)}
                  className="input"
                />
              </Field>
              <Field label="UF" error={errors.uf?.message}>
                <input
                  {...register("uf", { setValueAs: (v: string) => v.toUpperCase() })}
                  maxLength={2}
                  autoComplete="address-level1"
                  aria-invalid={Boolean(errors.uf)}
                  className="input uppercase"
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Envio">
          {quotesLoading ? (
            <div className="flex flex-col gap-2" aria-live="polite">
              <p className="sr-only">Calculando frete...</p>
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : quotes.length > 0 ? (
            <div role="radiogroup" aria-label="Opções de envio" className="flex flex-col gap-2">
              {quotes.map((q) => (
                <label
                  key={q.servico}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
                >
                  <input
                    type="radio"
                    name="servico"
                    checked={selectedServico === q.servico}
                    onChange={() => setSelectedServico(q.servico)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{q.nome}</span>
                    <span className="text-muted-foreground">{q.prazoDias} dias úteis</span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatBRL(q.valor)}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {quotesError ?? "Preencha o CEP para calcular o frete real pelos Correios."}
            </p>
          )}
        </Section>
      </div>

      <aside className="card p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold tracking-tight">Resumo do pedido</h2>

        <ul className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <li key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.foto ? (
                  <img src={item.foto} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <p className="min-w-0 flex-1 text-sm">
                {item.quantidade}x {item.nome}
                {item.tamanho ? ` (${item.tamanho})` : ""}
              </p>
              <p className="shrink-0 text-sm font-medium tabular-nums">
                {formatBRL(item.preco * item.quantidade)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Frete {quoteSelecionada ? `(${quoteSelecionada.nome})` : "(estimativa)"}
            </span>
            <span className="tabular-nums">{formatBRL(frete)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-border pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatBRL(subtotal + frete)}</span>
          </div>
        </div>

        {submitError && (
          <p role="alert" className="mt-4 rounded-xl bg-destructive-soft px-4 py-3 text-sm text-destructive">
            {submitError}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary mt-5 h-12 w-full sm:h-12">
          {submitting ? "Finalizando..." : "Confirmar pedido"}
        </button>
      </aside>
    </form>
  );
}
