import { Truck } from "lucide-react";
import { Badge } from "@/components/ds/Badge";
import { PageHeader } from "@/components/ds/PageHeader";

export default function AdminIntegrationsPage() {
  const clientId = import.meta.env.VITE_MELHOR_ENVIO_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_MELHOR_ENVIO_REDIRECT_URI;
  const sandbox = import.meta.env.VITE_MELHOR_ENVIO_SANDBOX === "true";

  const baseUrl = sandbox
    ? "https://sandbox.melhorenvio.com.br"
    : "https://melhorenvio.com.br";

  const scopes = [
    "shipping-calculate",
    "shipping-cancel",
    "shipping-checkout",
    "shipping-companies",
    "shipping-generate",
    "shipping-preview",
    "shipping-print",
    "shipping-share",
    "shipping-tracking",
    "ecommerce-shipping",
  ].join(" ");

  const authorizeUrl = clientId
    ? `${baseUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri ?? ""
      )}&response_type=code&scope=${encodeURIComponent(scopes)}`
    : null;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Integrações" description="Serviços conectados à loja." />

      <section className="card mt-8 max-w-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
            <Truck className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Melhor Envio</h2>
              <Badge tone={authorizeUrl ? "success" : "warning"}>
                {authorizeUrl ? "Pronto para conectar" : "Não configurado"}
              </Badge>
              {sandbox && <Badge tone="info">Ambiente de testes</Badge>}
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Conecte sua conta do Melhor Envio para calcular frete e gerar etiquetas direto pelo
              painel.
            </p>

            {authorizeUrl ? (
              <a href={authorizeUrl} className="btn btn-primary mt-4">
                Conectar com Melhor Envio
              </a>
            ) : (
              <p className="mt-3 text-sm text-warning">
                Configure VITE_MELHOR_ENVIO_CLIENT_ID e VITE_MELHOR_ENVIO_REDIRECT_URI no .env
                antes de conectar.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
