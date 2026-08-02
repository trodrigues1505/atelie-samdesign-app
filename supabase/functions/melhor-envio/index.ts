// Supabase Edge Function: melhor-envio
//
// O Melhor Envio usa autenticação OAuth2 (Client ID + Secret), não um
// token pessoal simples. O fluxo é:
//   1. Você clica em "Conectar" no painel admin do app.
//   2. É redirecionado pro Melhor Envio, faz login e autoriza o app.
//   3. Volta pro app com um "code" na URL.
//   4. O app troca esse code pelos tokens de acesso (access_token +
//      refresh_token) através da ação "conectar" abaixo.
//   5. Os tokens ficam guardados na tabela `integration_tokens`. O
//      access_token expira a cada 30 dias; esta função renova sozinha
//      usando o refresh_token (válido por 45 dias), sem você precisar
//      fazer nada — só refazer a conexão manual se passar dos 45 dias
//      sem uso.
//
// Secrets que esta função espera (Project Settings > Edge Functions > Secrets):
//   MELHOR_ENVIO_CLIENT_ID       — Client ID do app cadastrado no Melhor Envio
//   MELHOR_ENVIO_CLIENT_SECRET   — Secret do app
//   MELHOR_ENVIO_REDIRECT_URI    — URL de callback (ex: .../oauth/melhor-envio/callback)
//   MELHOR_ENVIO_USER_AGENT      — exigido pela API: "NomeDoApp (email@contato.com)"
//   MELHOR_ENVIO_SANDBOX         — "true" para ambiente de testes, "false" para produção
//   CORREIOS_CEP_ORIGEM          — CEP de onde os pedidos são enviados
//   SUPABASE_SERVICE_ROLE_KEY    — já disponível automaticamente

import { createClient } from "npm:@supabase/supabase-js@2";

function getBaseUrl(): string {
  const sandbox = Deno.env.get("MELHOR_ENVIO_SANDBOX") === "true";
  return sandbox
    ? "https://sandbox.melhorenvio.com.br"
    : "https://melhorenvio.com.br";
}

// --- Gestão de token (troca inicial + renovação automática) ---

async function trocarCodePorToken(code: string, supabaseAdmin: ReturnType<typeof createClient>) {
  const clientId = Deno.env.get("MELHOR_ENVIO_CLIENT_ID");
  const clientSecret = Deno.env.get("MELHOR_ENVIO_CLIENT_SECRET");
  const redirectUri = Deno.env.get("MELHOR_ENVIO_REDIRECT_URI");

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Client ID/Secret/Redirect URI do Melhor Envio não configurados nos secrets.");
  }

  const res = await fetch(`${getBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao trocar código por token (${res.status}): ${body}`);
  }

  const data = await res.json();
  await salvarTokens(data, supabaseAdmin);
  return { conectado: true };
}

async function salvarTokens(data: Record<string, unknown>, supabaseAdmin: ReturnType<typeof createClient>) {
  const expiresAt = new Date(Date.now() + Number(data.expires_in) * 1000).toISOString();
  const { error } = await supabaseAdmin.from("integration_tokens").upsert({
    provider: "melhor_envio",
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

async function getAccessToken(supabaseAdmin: ReturnType<typeof createClient>): Promise<string> {
  const { data: row } = await supabaseAdmin
    .from("integration_tokens")
    .select("*")
    .eq("provider", "melhor_envio")
    .maybeSingle();

  if (!row) {
    throw new Error(
      "Melhor Envio ainda não foi conectado. Vá em Admin > Integrações e clique em Conectar."
    );
  }

  // Ainda válido (com 60s de margem)?
  if (new Date(row.expires_at).getTime() > Date.now() + 60_000) {
    return row.access_token;
  }

  // Expirado: renova usando o refresh_token, sem exigir ação do usuário.
  const clientId = Deno.env.get("MELHOR_ENVIO_CLIENT_ID");
  const clientSecret = Deno.env.get("MELHOR_ENVIO_CLIENT_SECRET");

  const res = await fetch(`${getBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: row.refresh_token,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Falha ao renovar token do Melhor Envio (${res.status}): ${body}. ` +
        "Pode ser necessário reconectar manualmente em Admin > Integrações."
    );
  }

  const data = await res.json();
  await salvarTokens(data, supabaseAdmin);
  return data.access_token as string;
}

async function melhorEnvioFetch(
  path: string,
  supabaseAdmin: ReturnType<typeof createClient>,
  init: RequestInit = {}
) {
  const token = await getAccessToken(supabaseAdmin);
  const userAgent = Deno.env.get("MELHOR_ENVIO_USER_AGENT");
  if (!userAgent) throw new Error("MELHOR_ENVIO_USER_AGENT não configurado.");

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

// --- Ações de frete ---

async function calcularFrete(
  cepDestino: string,
  pesoGramas: number,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  const cepOrigem = Deno.env.get("CORREIOS_CEP_ORIGEM");
  if (!cepOrigem) throw new Error("CORREIOS_CEP_ORIGEM não configurado.");

  const pesoKg = Math.max(0.1, pesoGramas / 1000);

  const data = await melhorEnvioFetch("/me/shipment/calculate", supabaseAdmin, {
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

  const cartItem = await melhorEnvioFetch("/me/cart", supabaseAdmin, {
    method: "POST",
    body: JSON.stringify({
      service: 1, // 1 = PAC (Correios) — ajuste conforme o serviço escolhido no checkout
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

  await melhorEnvioFetch("/me/shipment/checkout", supabaseAdmin, {
    method: "POST",
    body: JSON.stringify({ orders: [orderMelhorEnvioId] }),
  });

  await melhorEnvioFetch("/me/shipment/generate", supabaseAdmin, {
    method: "POST",
    body: JSON.stringify({ orders: [orderMelhorEnvioId] }),
  });

  const printData = await melhorEnvioFetch("/me/shipment/print", supabaseAdmin, {
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

async function cancelarEtiqueta(codigoRastreio: string, supabaseAdmin: ReturnType<typeof createClient>) {
  await melhorEnvioFetch("/me/shipment/cancel", supabaseAdmin, {
    method: "POST",
    body: JSON.stringify({
      order: { id: codigoRastreio, reason_id: 1, description: "Cancelado pelo lojista" },
    }),
  });
}

async function consultarRastreio(codigoRastreio: string, supabaseAdmin: ReturnType<typeof createClient>) {
  const data = await melhorEnvioFetch("/me/shipment/tracking", supabaseAdmin, {
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

    // Todas as ações aqui envolvem credenciais/custo real — exigem admin.
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(jwt);

    if (!user) throw new Error("Não autenticado.");

    if (action === "conectar" || action === "gerarEtiqueta" || action === "cancelarEtiqueta") {
      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        throw new Error("Apenas administradores podem realizar esta ação.");
      }
    }

    let result;
    switch (action) {
      case "conectar":
        result = await trocarCodePorToken(payload.code, supabaseAdmin);
        break;
      case "calcularFrete":
        result = await calcularFrete(payload.cepDestino, payload.pesoGramas, supabaseAdmin);
        break;
      case "gerarEtiqueta":
        result = await gerarEtiqueta(payload.orderId, supabaseAdmin);
        break;
      case "cancelarEtiqueta":
        result = await cancelarEtiqueta(payload.codigoRastreio, supabaseAdmin);
        break;
      case "consultarRastreio":
        result = await consultarRastreio(payload.codigoRastreio, supabaseAdmin);
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
