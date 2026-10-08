import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleAlert, CircleCheck } from "lucide-react";
import { MelhorEnvioProvider } from "@/services/shipping";

export default function MelhorEnvioCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"conectando" | "sucesso" | "erro">("conectando");
  const [errorMsg, setErrorMsg] = useState("");
  // O código de autorização só vale uma vez. Em desenvolvimento o StrictMode executa o
  // efeito duas vezes, e a segunda chamada falhava e trocava "sucesso" por "erro".
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("erro");
      setErrorMsg("Nenhum código de autorização recebido na URL.");
      return;
    }
    if (startedFor.current === code) return;
    startedFor.current = code;

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
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center sm:py-24">
      {status === "conectando" && (
        <div role="status" className="flex flex-col items-center">
          <div
            aria-hidden="true"
            className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          />
          <p className="mt-4 text-muted-foreground">Conectando com o Melhor Envio...</p>
        </div>
      )}

      {status === "sucesso" && (
        <>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
            <CircleCheck className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Conectado com sucesso!</h1>
          <p className="mt-2 text-muted-foreground">
            O app já pode calcular frete e gerar etiquetas pelo Melhor Envio.
          </p>
        </>
      )}

      {status === "erro" && (
        <div role="alert" className="flex flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive-soft text-destructive">
            <CircleAlert className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Erro ao conectar</h1>
          <p className="mt-2 text-muted-foreground">{errorMsg}</p>
        </div>
      )}

      {status !== "conectando" && (
        <Link
          to="/admin/integracoes"
          className={status === "sucesso" ? "btn btn-primary mt-8" : "btn btn-secondary mt-8"}
        >
          Voltar para Integrações
        </Link>
      )}
    </div>
  );
}
