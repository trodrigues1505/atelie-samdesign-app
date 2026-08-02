import { useEffect, useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

const DISMISSED_KEY = "atelie-samdesign-install-banner-dismissed";

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallBanner() {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "1"
  );

  useEffect(() => {
    if (isInstalled) setDismissed(true);
  }, [isInstalled]);

  function handleClose() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  async function handleInstallClick() {
    await promptInstall();
  }

  if (dismissed || isInstalled) return null;
  // Sem o evento nativo de instalação (Android/desktop Chrome) e fora do
  // Safari iOS não tem como oferecer instalação real — não mostra o banner.
  if (!canInstall && !isIOS()) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-primary px-4 py-2 text-sm text-primary-foreground">
      <span>
        Instale nosso aplicativo.
        {isIOS() && !canInstall && (
          <span className="ml-1 font-normal opacity-90">
            Toque em Compartilhar e depois em "Adicionar à Tela de Início".
          </span>
        )}
      </span>
      <div className="flex flex-shrink-0 items-center gap-2">
        {canInstall && (
          <button
            onClick={handleInstallClick}
            className="rounded-md bg-white/20 px-3 py-1 font-medium hover:bg-white/30"
          >
            Instalar
          </button>
        )}
        <button
          onClick={handleClose}
          aria-label="Fechar"
          className="rounded-md px-2 py-1 hover:bg-white/20"
        >
          ×
        </button>
      </div>
    </div>
  );
}
