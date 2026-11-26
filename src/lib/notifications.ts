import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { BOOKING_STATUS, PAYMENT_STATUS, VERIFICATION } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export const notificationCopy = {
  en: { title: "Notifications", empty: "No notifications yet", all: "View all", markAll: "Mark all read", markRead: "Mark as read", unread: "unread", loading: "Loading notifications…", error: "Notifications could not be loaded.", retry: "Try again", saveError: "Could not mark notifications as read.", previous: "Previous page", next: "Next page", verification: "Verification", booking: "Booking", payment: "Payment", page: "Page" },
  bn: { title: "নোটিফিকেশন", empty: "এখনও কোনো নোটিফিকেশন নেই", all: "সব দেখুন", markAll: "সব পড়া হয়েছে", markRead: "পড়া হয়েছে চিহ্নিত করুন", unread: "অপঠিত", loading: "নোটিফিকেশন লোড হচ্ছে…", error: "নোটিফিকেশন লোড করা যায়নি।", retry: "আবার চেষ্টা করুন", saveError: "পড়া হয়েছে চিহ্নিত করা যায়নি।", previous: "আগের পৃষ্ঠা", next: "পরের পৃষ্ঠা", verification: "যাচাইকরণ", booking: "বুকিং", payment: "পেমেন্ট", page: "পৃষ্ঠা" },
};

export function notificationStatus(entry: Notification, status: string, lang: "en" | "bn") {
  const values: Record<string, { label: { en: string; bn: string } }> = entry.category === "booking"
    ? BOOKING_STATUS : entry.category === "payment" ? PAYMENT_STATUS : VERIFICATION;
  return values[status]?.label[lang] ?? status;
}

export function useNotifications(page = 0, pageSize = 10) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const unread = useQuery({
    queryKey: ["notifications", userId, "unread"],
    enabled: Boolean(userId),
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!userId) return 0;
      const result = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
      if (result.error) throw result.error;
      return result.count ?? 0;
    },
  });
  const list = useQuery({
    queryKey: ["notifications", userId, "list", page, pageSize],
    enabled: Boolean(userId),
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!userId) return { rows: [], count: 0 };
      const result = await supabase.from("notifications").select("*", { count: "exact" }).eq("user_id", userId)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
      if (result.error) throw result.error;
      return { rows: result.data ?? [], count: result.count ?? 0 };
    },
  });
  const markRead = useMutation({
    mutationFn: async (id: string | null) => {
      if (!userId) throw new Error("Not signed in");
      const now = new Date().toISOString();
      let update = supabase.from("notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
      update = id ? update.eq("id", id) : update.lte("created_at", now);
      const result = await update;
      if (result.error) throw result.error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
    onError: () => toast.error(notificationCopy[lang].saveError),
  });
  return { list, unread, markRead };
}