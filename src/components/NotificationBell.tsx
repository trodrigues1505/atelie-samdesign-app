import { useEffect, useId, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { notificationRepository } from "@/repositories/notificationRepository";
import type { Notification } from "@/types/database";

type NotificationId = Notification["id"];

// Junta listas sem repetir ids: a busca inicial e o evento em tempo real
// podem trazer a mesma notificação.
function mergeById(first: Notification[], second: Notification[]): Notification[] {
  const seen = new Set<NotificationId>();
  return [...first, ...second].filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

/**
 * Sino de notificações.
 * No celular o painel ocupa a largura da tela e se ancora no elemento
 * posicionado mais próximo (o <header> sticky do layout); a partir de `sm`
 * ele se ancora no próprio botão.
 * Use key={userId} ao renderizar, para zerar o estado ao trocar de usuário.
 */
export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [freshIds, setFreshIds] = useState<Set<NotificationId>>(new Set());
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const unreadCount = notifications.filter((n) => !n.lida).length;

  useEffect(() => {
    let active = true;

    notificationRepository
      .listByUser(userId)
      .then((list) => {
        if (active) setNotifications((prev) => mergeById(prev, list));
      })
      .catch((error: unknown) => {
        console.error("Falha ao carregar notificações", error);
      });

    // Atualiza em tempo real quando uma nova notificação é criada
    // (ex: pelo trigger de mudança de etapa de produção).
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => mergeById([payload.new as Notification], prev));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleToggle() {
    if (open) {
      setOpen(false);
      setFreshIds(new Set());
      return;
    }
    setOpen(true);

    const unread = notifications.filter((n) => !n.lida);
    if (unread.length === 0) return;

    // Guarda quais eram novas para destacá-las enquanto o painel está aberto,
    // e marca como lidas na hora (desfaz se o servidor falhar).
    const unreadIds = new Set(unread.map((n) => n.id));
    setFreshIds(unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    try {
      await notificationRepository.markAllAsRead(userId);
    } catch (error) {
      console.error("Falha ao marcar notificações como lidas", error);
      setNotifications((prev) => prev.map((n) => (unreadIds.has(n.id) ? { ...n, lida: false } : n)));
      setFreshIds(new Set());
    }
  }

  return (
    <div className="sm:relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : "Notificações"}
        className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute inset-x-3 top-full z-50 mt-2 origin-top animate-pop overflow-hidden rounded-2xl border border-border bg-card shadow-xl sm:inset-x-auto sm:right-0 sm:w-96 sm:origin-top-right"
        >
          <div className="px-4 pb-2 pt-3.5 text-sm font-semibold">Notificações</div>

          <div className="max-h-[min(28rem,calc(100dvh-11rem))] overflow-y-auto pb-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-8 text-center">
                <BellOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">Nenhuma notificação por enquanto</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Avisamos aqui quando o seu pedido mudar de etapa.
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id} className="flex gap-3 px-4 py-3">
                    <span
                      className={
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full " +
                        (freshIds.has(n.id) ? "bg-primary" : "bg-transparent")
                      }
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {freshIds.has(n.id) && <span className="sr-only">Nova: </span>}
                        {n.titulo}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.mensagem}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
