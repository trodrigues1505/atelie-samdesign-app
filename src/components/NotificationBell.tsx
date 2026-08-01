import { useEffect, useRef, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { notificationRepository } from "@/repositories/notificationRepository";
import type { Notification } from "@/types/database";

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.lida).length;

  useEffect(() => {
    notificationRepository.listByUser(userId).then(setNotifications);

    // Atualiza em tempo real quando uma nova notificação é criada
    // (ex: pelo trigger de mudança de etapa de produção).
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (unreadCount > 0) {
      await notificationRepository.markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className="relative rounded-md px-3 py-1.5 text-sm transition hover:bg-muted"
        aria-label="Notificações"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-border bg-background shadow-lg">
          <div className="border-b border-border px-4 py-2 text-sm font-semibold">
            Notificações
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhuma notificação ainda.
              </p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="border-b border-border px-4 py-3 last:border-b-0">
                  <p className="text-sm font-medium">{n.titulo}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.mensagem}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
