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
    <div className="p-6">
      <h1 className="text-2xl font-bold">Integrações</h1>

      <section className="mt-6 max-w-lg rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold">Melhor Envio</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte sua conta do Melhor Envio para calcular frete e gerar etiquetas
          direto pelo painel. {sandbox && "Ambiente de testes (sandbox) ativo."}
        </p>

        {!clientId ? (
          <p className="mt-3 text-sm text-red-600">
            Configure VITE_MELHOR_ENVIO_CLIENT_ID e VITE_MELHOR_ENVIO_REDIRECT_URI
            no .env antes de conectar.
          </p>
        ) : (
          <a
            href={authorizeUrl!}
            className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Conectar com Melhor Envio
          </a>
        )}
      </section>
    </div>
  );
}
