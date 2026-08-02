import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MelhorEnvioProvider } from "@/services/shipping";

export default function MelhorEnvioCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"conectando" | "sucesso" | "erro">("conectando");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("erro");
      setErrorMsg("Nenhum código de autorização recebido na URL.");
      return;
    }

    const provider = new MelhorEnvioProvider();
    provider
      .conectar(code)
      .then(() => setStatus("sucesso"))
      .catch((err) => {
        setStatus("erro");
        setErrorMsg(err instanceof Error ? err.message : "Erro ao conectar.");
      });
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-md p-6 text-center">
      {status === "conectando" && (
        <p className="text-sm text-muted-foreground">Conectando com o Melhor Envio...</p>
      )}

      {status === "sucesso" && (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
            ✓
          </div>
          <h1 className="mt-4 text-xl font-bold">Conectado com sucesso!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O app já pode calcular frete e gerar etiquetas pelo Melhor Envio.
          </p>
        </>
      )}

      {status === "erro" && (
        <>
          <h1 className="text-xl font-bold text-red-600">Erro ao conectar</h1>
          <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
        </>
      )}

      <Link
        to="/admin/integracoes"
        className="mt-6 inline-block rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
      >
        Voltar para Integrações
      </Link>
    </div>
  );
}
