import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ClipboardList, Printer } from "lucide-react";
import { orderRepository } from "@/repositories/orderRepository";
import { productionRepository } from "@/repositories/productionRepository";
import { shippingProvider } from "@/services/shipping";
import type { Order, OrderItem, ProductionRecord } from "@/types/database";
import type { TrackingEvent } from "@/types/shipping";
import { OrderTimeline } from "@/components/OrderTimeline";
import { Badge } from "@/components/ds/Badge";
import { EmptyState } from "@/components/ds/EmptyState";
import { ErrorState } from "@/components/ds/ErrorState";
import { useFeedback } from "@/components/ds/Feedback";
import { PageHeader } from "@/components/ds/PageHeader";
import { Section } from "@/components/ds/Section";
import { Skeleton } from "@/components/ds/Skeleton";
import { formatBRL, formatDateTime } from "@/lib/format";
import { STATUS_FLOW, STATUS_LABEL, STATUS_TONE } from "@/lib/orderStatus";

const STATUS_OPTIONS: Order["status"][] = [...STATUS_FLOW, "cancelado"];

const STAGE_OPTIONS: ProductionRecord["etapa"][] = [
  "recebido",
  "modelagem",
  "corte",
  "costura",
  "acabamento",
  "conferencia",
  "pronto",
  "envio",
];

const STAGE_LABEL: Record<ProductionRecord["etapa"], string> = {
  recebido: "Pedido recebido",
  modelagem: "Modelagem",
  corte: "Corte",
  costura: "Costura",
  acabamento: "Acabamento",
  conferencia: "Controle de qualidade",
  pronto: "Pronto",
  envio: "Enviado",
};

type ItemWithProduct = OrderItem & { products: { nome: string } | null };

async function fetchAll(orderId: string) {
  const [order, items, records] = await Promise.all([
    orderRepository.getById(orderId),
    orderRepository.listItems(orderId),
    productionRepository.listByOrder(orderId),
  ]);
  return { order, items, records };
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast, confirm } = useFeedback();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<ItemWithProduct[]>([]);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [savingStatus, setSavingStatus] = useState(false);
  const [addingStage, setAddingStage] = useState(false);
  const [nextStage, setNextStage] = useState<ProductionRecord["etapa"]>("modelagem");
  const [observacao, setObservacao] = useState("");
  const [rastreio, setRastreio] = useState("");
  const [savingRastreio, setSavingRastreio] = useState(false);
  const [gerandoEtiqueta, setGerandoEtiqueta] = useState(false);
  const [etiquetaError, setEtiquetaError] = useState<string | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [consultandoRastreio, setConsultandoRastreio] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    fetchAll(id)
      .then((data) => {
        if (!active) return;
        setOrder(data.order);
        setItems(data.items);
        setRecords(data.records);
        setRastreio(data.order?.rastreio ?? "");
      })
      .catch((err) => {
        if (active) setLoadError(err instanceof Error ? err.message : "Erro ao carregar pedido.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);

  async function handleStatusChange(status: Order["status"]) {
    if (!order || status === order.status) return;
    if (status === "cancelado") {
      const ok = await confirm({
        title: `Cancelar o pedido ${order.numero_pedido}?`,
        description: "O pedido passa para o status Cancelado e deixa de contar no faturamento.",
        confirmLabel: "Cancelar pedido",
        destructive: true,
      });
      if (!ok) return;
    }
    setSavingStatus(true);
    try {
      const updated = await orderRepository.updateStatus(order.id, status);
      setOrder(updated);
      toast(`Status alterado para ${STATUS_LABEL[status]}.`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao atualizar status.", "error");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleAddStage() {
    if (!order) return;
    setAddingStage(true);
    try {
      const record = await productionRepository.addStage(
        order.id,
        nextStage,
        "Admin",
        observacao || undefined
      );
      setRecords((prev) => [...prev, record]);
      setObservacao("");
      toast(`Etapa "${STAGE_LABEL[nextStage]}" registrada.`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao registrar etapa.", "error");
    } finally {
      setAddingStage(false);
    }
  }

  async function handleSaveRastreio() {
    if (!order) return;
    setSavingRastreio(true);
    try {
      const updated = await orderRepository.updateTracking(order.id, rastreio);
      setOrder(updated);
      toast("Código de rastreio salvo.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar rastreio.", "error");
    } finally {
      setSavingRastreio(false);
    }
  }

  async function handleGerarEtiqueta() {
    if (!order) return;
    setGerandoEtiqueta(true);
    setEtiquetaError(null);
    try {
      const result = await shippingProvider.gerarEtiqueta({ orderId: order.id });
      setRastreio(result.codigoRastreio);
      // Recarrega sem trocar a tela por "Carregando...", para não perder o que está digitado.
      const data = await fetchAll(order.id);
      setOrder(data.order);
      setItems(data.items);
      setRecords(data.records);
      toast("Etiqueta gerada.", "success");
    } catch (err) {
      setEtiquetaError(
        err instanceof Error
          ? err.message
          : "Erro ao gerar etiqueta. Confirme se a Edge Function dos Correios está publicada e configurada."
      );
    } finally {
      setGerandoEtiqueta(false);
    }
  }

  async function handleConsultarRastreio() {
    if (!order?.rastreio) return;
    setConsultandoRastreio(true);
    try {
      const events = await shippingProvider.consultarRastreio(order.rastreio);
      setTrackingEvents(events);
      if (events.length === 0) toast("Nenhum evento de rastreio ainda.", "info");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao consultar rastreio nos Correios.",
        "error"
      );
    } finally {
      setConsultandoRastreio(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-6 h-40" />
        <Skeleton className="mt-4 h-40" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <ErrorState
          title="Não foi possível carregar o pedido"
          message={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <EmptyState icon={ClipboardList} title="Pedido não encontrado" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        backTo="/admin/pedidos"
        backLabel="Pedidos"
        title={`Pedido ${order.numero_pedido}`}
        description={formatDateTime(order.created_at)}
        actions={<Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Section title="Itens">
          <ul className="flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>
                  {item.quantidade}x {item.products?.nome ?? "Produto"}
                </span>
                <span className="tabular-nums">{formatBRL(item.preco * item.quantidade)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-3 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatBRL(order.total)}</span>
          </div>
        </Section>

        <Section title="Endereço de entrega">
          <p className="text-sm text-muted-foreground">
            {order.endereco.logradouro}, {order.endereco.numero}
            {order.endereco.complemento ? ` — ${order.endereco.complemento}` : ""}
            <br />
            {order.endereco.bairro} — {order.endereco.cidade}/{order.endereco.uf}
            <br />
            CEP {order.endereco.cep}
          </p>
        </Section>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <Section title="Status do pedido">
          <select
            aria-label="Status do pedido"
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value as Order["status"])}
            disabled={savingStatus}
            className="input w-full sm:max-w-xs"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Section>

        <Section title="Avançar etapa de produção" description="Isso registra a etapa na linha do tempo e notifica o cliente automaticamente.">
          <div className="grid gap-2 sm:grid-cols-[12rem_minmax(0,1fr)_auto]">
            <select
              aria-label="Etapa de produção"
              value={nextStage}
              onChange={(e) => setNextStage(e.target.value as ProductionRecord["etapa"])}
              className="input"
            >
              {STAGE_OPTIONS.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABEL[stage]}
                </option>
              ))}
            </select>
            <input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observação (opcional)"
              aria-label="Observação"
              className="input"
            />
            <button type="button" onClick={handleAddStage} disabled={addingStage} className="btn btn-primary">
              {addingStage ? "Registrando..." : "Registrar etapa"}
            </button>
          </div>
        </Section>

        <Section title="Etiqueta e rastreio (Correios)">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGerarEtiqueta}
              disabled={gerandoEtiqueta || Boolean(order.etiqueta_url)}
              className="btn btn-primary"
            >
              {gerandoEtiqueta
                ? "Gerando..."
                : order.etiqueta_url
                  ? "Etiqueta já gerada"
                  : "Gerar etiqueta via Correios"}
            </button>

            {order.etiqueta_url && (
              <a href={order.etiqueta_url} target="_blank" rel="noreferrer" className="btn btn-secondary">
                <Printer className="h-4 w-4" aria-hidden="true" />
                Imprimir etiqueta (PDF)
              </a>
            )}
          </div>

          {etiquetaError && (
            <p role="alert" className="mt-3 rounded-xl bg-destructive-soft px-4 py-3 text-sm text-destructive">
              {etiquetaError}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={rastreio}
              onChange={(e) => setRastreio(e.target.value)}
              placeholder="Código de rastreio"
              aria-label="Código de rastreio"
              className="input min-w-0 flex-1"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveRastreio}
                disabled={savingRastreio}
                className="btn btn-secondary flex-1 sm:flex-none"
              >
                {savingRastreio ? "Salvando..." : "Salvar"}
              </button>
              {order.rastreio && (
                <button
                  type="button"
                  onClick={handleConsultarRastreio}
                  disabled={consultandoRastreio}
                  className="btn btn-secondary flex-1 sm:flex-none"
                >
                  {consultandoRastreio ? "Consultando..." : "Consultar rastreio"}
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            O código é preenchido automaticamente ao gerar a etiqueta.
          </p>

          {trackingEvents.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
              {trackingEvents.map((e, idx) => (
                <li key={idx}>
                  <span className="text-muted-foreground">{formatDateTime(e.data)}</span>
                  <br />
                  {e.descricao}
                  {e.local ? ` (${e.local})` : ""}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <h2 className="mt-8 text-lg font-semibold tracking-tight">Linha do tempo</h2>
      <div className="mt-4">
        <OrderTimeline records={records} />
      </div>
    </div>
  );
}
