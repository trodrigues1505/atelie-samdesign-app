// Supabase Edge Function: melhor-envio
//
// Autenticação via TOKEN PESSOAL (não OAuth).
// O token é gerado em: melhorenvio.com.br/painel/gerenciar/tokens
//
// Secrets necessários (Project Settings > Edge Functions > Secrets):
//   MELHOR_ENVIO_TOKEN       — token pessoal gerado no painel do Melhor Envio
//   MELHOR_ENVIO_USER_AGENT  — obrigatório pela API: "NomeDoApp (email@contato.com)"
//   MELHOR_ENVIO_SANDBOX     — "true" para testes, "false" para produção
//   CORREIOS_CEP_ORIGEM      — CEP de onde os pedidos são enviados
//   SUPABASE_SERVICE_ROLE_KEY — disponível automaticamente
//
// ATENÇÃO: o token pessoal expira em ~1 ano (ver validade no painel).
// Quando expirar, gere um novo token e atualize o secret MELHOR_ENVIO_TOKEN.

import { createClient } from "npm:@supabase/supabase-js@2";

function getBaseUrl(): string {
  const sandbox = Deno.env.get("MELHOR_ENVIO_SANDBOX") === "true";
  return sandbox
    ? "https://sandbox.melhorenvio.com.br"
    : "https://melhorenvio.com.br";
}

async function melhorEnvioFetch(path: string, init: RequestInit = {}) {
  const token = Deno.env.get("MELHOR_ENVIO_TOKEN");
  const userAgent = Deno.env.get("MELHOR_ENVIO_USER_AGENT");

  if (!token) throw new Error("MELHOR_ENVIO_TOKEN não configurado nos secrets da Edge Function.");
  if (!userAgent) throw new Error("MELHOR_ENVIO_USER_AGENT não configurado nos secrets da Edge Function.");

  const res = await fetch(`${getBaseUrl()}/api/v2${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": userAgent,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Melhor Envio respondeu ${res.status} em ${path}: ${body}`);
  }
  return res.json();
}

// --- Ações ---

async function calcularFrete(cepDestino: string, pesoGramas: number) {
  const cepOrigem = Deno.env.get("CORREIOS_CEP_ORIGEM");
  if (!cepOrigem) throw new Error("CORREIOS_CEP_ORIGEM não configurado.");

  const pesoKg = Math.max(0.1, pesoGramas / 1000);

  const data = await melhorEnvioFetch("/me/shipment/calculate", {
    method: "POST",
    body: JSON.stringify({
      from: { postal_code: cepOrigem.replace(/\D/g, "") },
      to: { postal_code: cepDestino.replace(/\D/g, "") },
      package: { weight: pesoKg, width: 20, height: 10, length: 20 },
    }),
  });

  const lista = Array.isArray(data) ? data : [];

  return lista
    .filter((item: Record<string, unknown>) => !item.error)
    .filter((item: Record<string, unknown>) => {
      const nome = String((item.name as string) ?? "").toUpperCase();
      return nome.includes("PAC") || nome.includes("SEDEX");
    })
    .map((item: Record<string, unknown>) => {
      const nome = String((item.name as string) ?? "");
      const servico = nome.toUpperCase().includes("SEDEX") ? "SEDEX" : "PAC";
      return {
        servico,
        nome,
        valor: Number(item.custom_price ?? item.price ?? 0),
        prazoDias: Number(item.custom_delivery_time ?? item.delivery_time ?? 0),
      };
    });
}

async function gerarEtiqueta(orderId: string, supabaseAdmin: ReturnType<typeof createClient>) {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*, users(nome, telefone)")
    .eq("id", orderId)
    .single();
  if (error || !order) throw new Error("Pedido não encontrado.");

  const cepOrigem = Deno.env.get("CORREIOS_CEP_ORIGEM");

  const cartItem = await melhorEnvioFetch("/me/cart", {
    method: "POST",
    body: JSON.stringify({
      service: 1,
      from: { postal_code: cepOrigem?.replace(/\D/g, "") },
      to: {
        name: order.users?.nome,
        phone: order.users?.telefone,
        postal_code: order.endereco.cep.replace(/\D/g, ""),
        address: order.endereco.logradouro,
        number: order.endereco.numero,
        complement: order.endereco.complemento ?? "",
        district: order.endereco.bairro,
        city: order.endereco.cidade,
        state_abbr: order.endereco.uf,
      },
      package: { weight: 1, width: 20, height: 10, length: 20 },
    }),
  });

  const orderMelhorEnvioId = cartItem.id;

  await melhorEnvioFetch("/me/shipment/checkout", {
    method: "POST",
    body: JSON.stringify({ orders: [orderMelhorEnvioId] }),
  });

  await melhorEnvioFetch("/me/shipment/generate", {
    method: "POST",
    body: JSON.stringify({ orders: [orderMelhorEnvioId] }),
  });

  const printData = await melhorEnvioFetch("/me/shipment/print", {
    method: "POST",
    body: JSON.stringify({ mode: "public", orders: [orderMelhorEnvioId] }),
  });

  const codigoRastreio = printData.tracking ?? orderMelhorEnvioId;
  const etiquetaUrlPdf = printData.url ?? null;

  await supabaseAdmin
    .from("orders")
    .update({ rastreio: codigoRastreio, etiqueta_url: etiquetaUrlPdf, status: "etiqueta_gerada" })
    .eq("id", orderId);

  return { codigoRastreio, etiquetaUrlPdf };
}

async function cancelarEtiqueta(codigoRastreio: string) {
  await melhorEnvioFetch("/me/shipment/cancel", {
    method: "POST",
    body: JSON.stringify({
      order: { id: codigoRastreio, reason_id: 1, description: "Cancelado pelo lojista" },
    }),
  });
}

async function consultarRastreio(codigoRastreio: string) {
  const data = await melhorEnvioFetch("/me/shipment/tracking", {
    method: "POST",
    body: JSON.stringify({ orders: [codigoRastreio] }),
  });

  const eventos = data?.[codigoRastreio]?.tracking ?? [];
  return eventos.map((e: Record<string, unknown>) => ({
    data: e.date ?? e.created_at,
    descricao: e.description ?? e.status,
    local: e.location,
  }));
}

// --- Servidor ---

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Ações que envolvem custo real exigem admin autenticado
    if (action === "gerarEtiqueta" || action === "cancelarEtiqueta") {
      const authHeader = req.headers.get("Authorization") ?? "";
      const jwt = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAdmin.auth.getUser(jwt);

      if (!user) throw new Error("Não autenticado.");

      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        throw new Error("Apenas administradores podem gerar/cancelar etiquetas.");
      }
    }

    let result;
    switch (action) {
      case "calcularFrete":
        result = await calcularFrete(payload.cepDestino, payload.pesoGramas);
        break;
      case "gerarEtiqueta":
        result = await gerarEtiqueta(payload.orderId, supabaseAdmin);
        break;
      case "cancelarEtiqueta":
        result = await cancelarEtiqueta(payload.codigoRastreio);
        break;
      case "consultarRastreio":
        result = await consultarRastreio(payload.codigoRastreio);
        break;
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
