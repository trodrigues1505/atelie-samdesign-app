// Supabase Edge Function: correios
//
// A estrutura de autenticação e das chamadas de preço/prazo abaixo foi
// conferida contra a documentação pública oficial dos Correios
// (correios.com.br/atendimento/developers/manuais) em agosto/2026. Ainda
// assim, antes de usar com clientes reais:
//   1. Confirme o código de serviço (coProduto) do SEU contrato para PAC e
//      SEDEX com seu representante comercial dos Correios, ou consultando
//      a API "Meu Contrato" (GET /meucontrato/v1/empresas/{cnpj}/contratos
//      /{contrato}/cartoes/{cartao}/servicos/{codigo}) — os valores abaixo
//      (03220 / 03298) são os mais comuns em contratos padrão, mas cada
//      contrato pode ter códigos próprios.
//   2. Teste primeiro em homologação (apihom.correios.com.br) ou com um
//      pedido de teste antes de usar com clientes reais — este código não
//      pôde ser executado contra a API de verdade neste ambiente.
//
// Secrets que esta função espera (configure em Project Settings > Edge
// Functions > Secrets, ou via `supabase secrets set` se usar a CLI):
//   CORREIOS_USUARIO           — usuário do Meu Correios Web Services
//   CORREIOS_SENHA             — senha (ou código de acesso) do Meu Correios
//   CORREIOS_CARTAO_POSTAGEM   — número do cartão de postagem do contrato
//   CORREIOS_CONTRATO          — número do contrato
//   CORREIOS_DR                — código da Diretoria Regional (ex: 72)
//   CORREIOS_CEP_ORIGEM        — CEP de onde os pedidos são enviados (o ateliê)
//   SUPABASE_SERVICE_ROLE_KEY  — já disponível automaticamente no ambiente
//                                 de Edge Functions do Supabase

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORREIOS_BASE_URL = "https://api.correios.com.br";

// Códigos de serviço para contrato — confirme os do SEU contrato específico
// (ver instruções no README sobre como confirmar via API Meu Contrato).
// Estes valores foram confirmados no portal Correios Log+ > Serviços do
// Contrato para este contrato específico (modalidade "Agência").
const SERVICO_SEDEX = "03050"; // SEDEX CONTRATO AG CC
const SERVICO_PAC = "03085"; // PAC CONTRATO AG CC

interface TokenCache {
  token: string;
  expiraEm: number; // epoch ms
}

let tokenCache: TokenCache | null = null;

async function getCorreiosToken(): Promise<string> {
  if (tokenCache && tokenCache.expiraEm > Date.now() + 30_000) {
    return tokenCache.token;
  }

  const usuario = Deno.env.get("CORREIOS_USUARIO");
  const senha = Deno.env.get("CORREIOS_SENHA");
  const cartaoPostagem = Deno.env.get("CORREIOS_CARTAO_POSTAGEM");
  const contrato = Deno.env.get("CORREIOS_CONTRATO");
  const dr = Deno.env.get("CORREIOS_DR");

  if (!usuario || !senha || !cartaoPostagem || !contrato || !dr) {
    throw new Error(
      "Credenciais dos Correios não configuradas nos secrets da Edge Function " +
        "(CORREIOS_USUARIO, CORREIOS_SENHA, CORREIOS_CARTAO_POSTAGEM, CORREIOS_CONTRATO, CORREIOS_DR)."
    );
  }

  const basicAuth = btoa(`${usuario}:${senha}`);

  const res = await fetch(`${CORREIOS_BASE_URL}/token/v1/autentica/cartaopostagem`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      numero: cartaoPostagem,
      contrato,
      dr: Number(dr),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao autenticar nos Correios (${res.status}): ${body}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.token,
    expiraEm: new Date(data.expiraEm).getTime(),
  };
  return tokenCache.token;
}

async function correiosFetch(path: string, init: RequestInit = {}) {
  const token = await getCorreiosToken();
  const res = await fetch(`${CORREIOS_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Correios respondeu ${res.status} em ${path}: ${body}`);
  }
  return res.json();
}

// --- Ações ---

async function calcularFrete(cepDestino: string, pesoGramas: number) {
  const cepOrigem = Deno.env.get("CORREIOS_CEP_ORIGEM");
  const contrato = Deno.env.get("CORREIOS_CONTRATO");
  const dr = Number(Deno.env.get("CORREIOS_DR"));
  if (!cepOrigem || !contrato) throw new Error("CORREIOS_CEP_ORIGEM/CONTRATO não configurados.");

  const pesoGramasArredondado = Math.max(100, Math.round(pesoGramas));
  const cepDestinoLimpo = cepDestino.replace(/\D/g, "");
  const cepOrigemLimpo = cepOrigem.replace(/\D/g, "");

  const servicos = [
    { servico: "SEDEX" as const, nome: "SEDEX", coProduto: SERVICO_SEDEX },
    { servico: "PAC" as const, nome: "PAC", coProduto: SERVICO_PAC },
  ];

  const parametrosBase = servicos.map((s, idx) => ({
    coProduto: s.coProduto,
    nuRequisicao: String(idx + 1).padStart(4, "0"),
    nuContrato: contrato,
    nuDR: dr,
    cepOrigem: cepOrigemLimpo,
    cepDestino: cepDestinoLimpo,
    psObjeto: String(pesoGramasArredondado),
    tpObjeto: "2", // 2 = Pacote/Caixa
    comprimento: "20",
    largura: "15",
    altura: "10",
  }));

  const [precos, prazos] = await Promise.all([
    correiosFetch("/preco/v1/nacional", {
      method: "POST",
      body: JSON.stringify({ idLote: "001", parametrosProduto: parametrosBase }),
    }),
    correiosFetch("/prazo/v1/nacional", {
      method: "POST",
      body: JSON.stringify({
        idLote: "001",
        parametrosPrazo: parametrosBase.map((p) => ({
          coProduto: p.coProduto,
          nuRequisicao: p.nuRequisicao,
          cepOrigem: p.cepOrigem,
          cepDestino: p.cepDestino,
        })),
      }),
    }),
  ]);

  const listaPrecos = Array.isArray(precos) ? precos : precos.resultado ?? [precos];
  const listaPrazos = Array.isArray(prazos) ? prazos : prazos.resultado ?? [prazos];

  return servicos.map((s) => {
    const preco = listaPrecos.find((p: Record<string, unknown>) => p.coProduto === s.coProduto);
    const prazo = listaPrazos.find((p: Record<string, unknown>) => p.coProduto === s.coProduto);
    return {
      servico: s.servico,
      nome: s.nome,
      valor: Number(preco?.pcFinal ?? 0),
      prazoDias: Number(prazo?.prazoEntrega ?? 0),
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

  // Estrutura simplificada — o payload real de prepostagem dos Correios
  // tem mais campos obrigatórios (remetente completo, código de serviço,
  // dimensões do objeto etc). Ajuste conforme a documentação/contrato.
  const prepostagem = await correiosFetch("/prepostagem/v1/prepostagens", {
    method: "POST",
    body: JSON.stringify({
      remetente: { cep: cepOrigem },
      destinatario: {
        nome: order.users?.nome,
        telefone: order.users?.telefone,
        endereco: {
          cep: order.endereco.cep,
          logradouro: order.endereco.logradouro,
          numero: order.endereco.numero,
          complemento: order.endereco.complemento,
          bairro: order.endereco.bairro,
          cidade: order.endereco.cidade,
          uf: order.endereco.uf,
        },
      },
      pesoInformado: 1,
      codigoServico: SERVICO_PAC,
    }),
  });

  const codigoRastreio = prepostagem.codigoObjeto ?? prepostagem.numeroEtiqueta;
  const etiquetaUrlPdf = prepostagem.urlEtiqueta ?? prepostagem.pdf ?? null;

  await supabaseAdmin
    .from("orders")
    .update({ rastreio: codigoRastreio, etiqueta_url: etiquetaUrlPdf, status: "etiqueta_gerada" })
    .eq("id", orderId);

  return { codigoRastreio, etiquetaUrlPdf };
}

async function cancelarEtiqueta(codigoRastreio: string) {
  await correiosFetch(`/prepostagem/v1/prepostagens/${codigoRastreio}`, {
    method: "DELETE",
  });
}

async function consultarRastreio(codigoRastreio: string) {
  const data = await correiosFetch(`/srorastro/v1/objetos/${codigoRastreio}`);
  const eventos = data.eventos ?? data.objetos?.[0]?.eventos ?? [];

  return eventos.map((e: Record<string, unknown>) => ({
    data: e.dtHrCriado ?? e.data,
    descricao: e.descricao,
    local: e.unidade?.endereco?.cidade ?? e.local,
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

    // Ações que geram custo real (etiqueta) exigem que quem chamou seja admin.
    if (action === "gerarEtiqueta" || action === "cancelarEtiqueta") {
      const authHeader = req.headers.get("Authorization") ?? "";
      const jwt = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(jwt);

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
