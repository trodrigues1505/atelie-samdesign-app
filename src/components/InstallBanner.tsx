import { useState } from "react";
import { Share, Smartphone, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { cn } from "@/lib/cn";

const DISMISSED_KEY = "atelie-samdesign-install-banner-dismissed";

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// localStorage pode lançar erro (ex.: navegação privada no Safari).
function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // sem armazenamento: o aviso some só até a próxima visita
  }
}

export function InstallBanner({ className }: { className?: string }) {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(wasDismissed);

  function handleClose() {
    rememberDismissed();
    setDismissed(true);
  }

  if (dismissed || isInstalled) return null;
  // Sem o evento nativo de instalação (Android/desktop Chrome) e fora do
  // Safari iOS não tem como oferecer instalação real — não mostra o banner.
  const ios = isIOS();
  if (!canInstall && !ios) return null;

  return (
    <div className={cn("px-4 pt-3", className)}>
      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 pr-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
          <Smartphone className="h-5 w-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium">Instale o aplicativo</p>
          <p className="text-muted-foreground">
            {canInstall ? (
              "Acompanhe seus pedidos direto da tela inicial."
            ) : (
              <>
                Toque em{" "}
                <Share className="inline h-4 w-4 align-text-bottom" aria-hidden="true" />{" "}
                Compartilhar e depois em “Adicionar à Tela de Início”.
              </>
            )}
          </p>
        </div>

        {canInstall && (
          <button
            type="button"
            onClick={() => {
              void promptInstall();
            }}
            className="btn btn-sm btn-primary"
          >
            Instalar
          </button>
        )}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar aviso de instalação"
          className="btn btn-sm btn-ghost w-10 px-0"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
