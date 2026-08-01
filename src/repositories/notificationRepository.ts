import { supabase } from "@/api/supabaseClient";
import type { Notification } from "@/types/database";

export const notificationRepository = {
  async listByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;
    return data ?? [];
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase.from("notifications").update({ lida: true }).eq("id", id);
    if (error) throw error;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ lida: true })
      .eq("user_id", userId)
      .eq("lida", false);
    if (error) throw error;
  },
};
