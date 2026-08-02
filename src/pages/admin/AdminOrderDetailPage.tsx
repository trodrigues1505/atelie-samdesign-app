import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { orderRepository } from "@/repositories/orderRepository";
import { productionRepository } from "@/repositories/productionRepository";
import { shippingProvider } from "@/services/shipping";
import type { Order, OrderItem, ProductionRecord } from "@/types/database";
import type { TrackingEvent } from "@/types/shipping";
import { OrderTimeline } from "@/components/OrderTimeline";
import { formatBRL } from "@/pages/client/ShopPage";

const STATUS_OPTIONS: Order["status"][] = [
  "recebido",
  "pagamento_confirmado",
  "em_producao",
  "pronto",
  "etiqueta_gerada",
  "enviado",
  "saiu_para_entrega",
  "entregue",
  "cancelado",
];

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

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Array<OrderItem & { products: { nome: string } | null }>>([]);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
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
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    const [orderData, itemsData, productionData] = await Promise.all([
      orderRepository.getById(id!),
      orderRepository.listItems(id!),
      productionRepository.listByOrder(id!),
    ]);
    setOrder(orderData);
    setItems(itemsData);
    setRecords(productionData);
    setRastreio(orderData?.rastreio ?? "");
    setLoading(false);
  }

  async function handleStatusChange(status: Order["status"]) {
    if (!order) return;
    setSavingStatus(true);
    try {
      const updated = await orderRepository.updateStatus(order.id, status);
      setOrder(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao atualizar status.");
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
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao registrar etapa.");
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
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar rastreio.");
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
      await load();
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
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Erro ao consultar rastreio nos Correios."
      );
    } finally {
      setConsultandoRastreio(false);
    }
  }

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Carregando...</p>;
  if (!order) return <p className="p-6 text-sm text-muted-foreground">Pedido não encontrado.</p>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Pedido {order.numero_pedido}</h1>
      <p className="text-sm text-muted-foreground">
        {new Date(order.created_at).toLocaleString("pt-BR")}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">Itens</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.quantidade}x {item.products?.nome ?? "Produto"}
                </span>
                <span>{formatBRL(item.preco * item.quantidade)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-2 text-sm font-semibold">
            <span>Total</span>
            <span>{formatBRL(order.total)}</span>
          </div>
        </section>

        <section className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">Endereço de entrega</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {order.endereco.logradouro}, {order.endereco.numero}
            {order.endereco.complemento ? ` — ${order.endereco.complemento}` : ""}
            <br />
            {order.endereco.bairro} — {order.endereco.cidade}/{order.endereco.uf}
            <br />
            CEP {order.endereco.cep}
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold">Status do pedido</h2>
        <select
          value={order.status}
          onChange={(e) => handleStatusChange(e.target.value as Order["status"])}
          disabled={savingStatus}
          className="input mt-2 max-w-xs"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </section>

      <section className="mt-6 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold">Etiqueta e rastreio (Correios)</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={handleGerarEtiqueta}
            disabled={gerandoEtiqueta || Boolean(order.etiqueta_url)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {gerandoEtiqueta
              ? "Gerando..."
              : order.etiqueta_url
                ? "Etiqueta já gerada"
                : "Gerar etiqueta via Correios"}
          </button>

          {order.etiqueta_url && (
            <a
              href={order.etiqueta_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-4 py-2 text-sm transition hover:bg-muted"
            >
              Imprimir etiqueta (PDF)
            </a>
          )}
        </div>

        {etiquetaError && <p className="mt-2 text-xs text-red-600">{etiquetaError}</p>}

        <div className="mt-4 flex gap-2">
          <input
            value={rastreio}
            onChange={(e) => setRastreio(e.target.value)}
            placeholder="Código de rastreio (preenchido automaticamente ao gerar etiqueta)"
            className="input flex-1"
          />
          <button
            onClick={handleSaveRastreio}
            disabled={savingRastreio}
            className="rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-muted disabled:opacity-50"
          >
            Salvar
          </button>
          {order.rastreio && (
            <button
              onClick={handleConsultarRastreio}
              disabled={consultandoRastreio}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-muted disabled:opacity-50"
            >
              {consultandoRastreio ? "Consultando..." : "Consultar rastreio"}
            </button>
          )}
        </div>

        {trackingEvents.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
            {trackingEvents.map((e, idx) => (
              <li key={idx}>
                {new Date(e.data).toLocaleString("pt-BR")} — {e.descricao}
                {e.local ? ` (${e.local})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold">Avançar etapa de produção</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Isso registra a etapa na linha do tempo e notifica o cliente automaticamente.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select
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
            className="input flex-1"
          />
          <button
            onClick={handleAddStage}
            disabled={addingStage}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {addingStage ? "Registrando..." : "Registrar etapa"}
          </button>
        </div>
      </section>

      <h2 className="mt-8 text-lg font-semibold">Linha do tempo</h2>
      <div className="mt-4">
        <OrderTimeline records={records} />
      </div>
    </div>
  );
}
