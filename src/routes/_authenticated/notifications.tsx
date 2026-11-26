import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationItems } from "@/components/layout/notification-items";
import { useI18n } from "@/lib/i18n";
import { notificationCopy, useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [
    { title: "Notifications | BrandLinks" },
    { name: "description", content: "Your private BrandLinks verification, booking and payment status updates." },
    { property: "og:title", content: "Notifications | BrandLinks" },
    { property: "og:description", content: "Your private BrandLinks verification, booking and payment status updates." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { lang } = useI18n();
  const copy = notificationCopy[lang];
  const [page, setPage] = useState(0);
  const { list, unread, markRead } = useNotifications(page, 20);
  const total = list.data?.count ?? 0;
  return <main className="page-container py-8 sm:py-12">
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="flex items-center gap-3 font-display text-2xl font-bold"><Bell className="size-6 text-primary" />{copy.title}</h1><p className="mt-2 text-sm text-muted-foreground">{unread.data ?? 0} {copy.unread}</p></div>
        <Button variant="outline" disabled={!unread.data || markRead.isPending} onClick={() => markRead.mutate(null)}><CheckCheck />{copy.markAll}</Button>
      </div>
      {list.isPending ? <p className="py-12 text-center text-muted-foreground">{copy.loading}</p> : list.isError || unread.isError ? <div role="alert" className="py-8"><p>{copy.error}</p><Button variant="outline" className="mt-3" onClick={() => { void list.refetch(); void unread.refetch(); }}>{copy.retry}</Button></div> : !list.data?.rows.length ? <p className="border-y py-16 text-center text-muted-foreground">{copy.empty}</p> : <div className="border-y"><NotificationItems rows={list.data.rows} busy={markRead.isPending} onRead={(id) => markRead.mutate(id)} /></div>}
      {(total > 20 || page > 0) && <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="outline" size="icon" aria-label={copy.previous} title={copy.previous} disabled={!page || list.isFetching} onClick={() => setPage((current) => Math.max(0, current - 1))}><ChevronLeft /></Button>
        <span className="text-sm text-muted-foreground">{copy.page} {page + 1}</span>
        <Button variant="outline" size="icon" aria-label={copy.next} title={copy.next} disabled={(page + 1) * 20 >= total || list.isFetching} onClick={() => setPage((current) => current + 1)}><ChevronRight /></Button>
      </div>}
    </div>
  </main>;
}