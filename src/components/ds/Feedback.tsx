import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  /** Ações que apagam ou desfazem algo: botão vermelho. */
  destructive?: boolean;
};

type FeedbackApi = {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

/** Substitui alert() e window.confirm() por avisos e diálogos no estilo do app. */
export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback precisa estar dentro de <FeedbackProvider>.");
  return ctx;
}

const TONE_ICON = {
  success: { Icon: CircleCheck, className: "text-success" },
  error: { Icon: CircleAlert, className: "text-destructive" },
  info: { Icon: Info, className: "text-info" },
} as const;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<
    (ConfirmOptions & { resolve: (value: boolean) => void }) | null
  >(null);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500);
    },
    [dismiss]
  );

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    []
  );

  function settle(value: boolean) {
    pending?.resolve(value);
    setPending(null);
  }

  const api = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[60] flex flex-col items-center gap-2 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:items-end"
      >
        {toasts.map((t) => {
          const { Icon, className } = TONE_ICON[t.tone];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-3 rounded-2xl border border-border bg-card p-3.5 text-sm shadow-xl"
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", className)} aria-hidden="true" />
              <p className="min-w-0 flex-1">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fechar aviso"
                className="-m-1 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {pending && <ConfirmDialog options={pending} onResult={settle} />}
    </FeedbackContext.Provider>
  );
}

function ConfirmDialog({
  options,
  onResult,
}: {
  options: ConfirmOptions;
  onResult: (value: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // <dialog> nativo: já traz foco preso, tecla Esc e camada acima de tudo.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();
    return () => {
      if (el.open) el.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onResult(false);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onResult(false);
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm animate-pop rounded-3xl border-0 bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/40"
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">{options.title}</h2>
        {options.description && (
          <p className="mt-2 text-sm text-muted-foreground">{options.description}</p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus
            onClick={() => onResult(false)}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onResult(true)}
            className={cn("btn", options.destructive ? "btn-destructive" : "btn-primary")}
          >
            {options.confirmLabel ?? "Confirmar"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
