import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n";
import { notificationCopy, useNotifications } from "@/lib/notifications";
import { NotificationItems } from "./notification-items";

export function NotificationBell() {
  const { lang } = useI18n();
  const copy = notificationCopy[lang];
  const { list, unread, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const count = unread.data ?? 0;
  return <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) { void list.refetch(); void unread.refetch(); } }}>
    <PopoverTrigger asChild><Button variant="ghost" size="icon" className="relative shrink-0" title={copy.title} aria-label={`${copy.title}${count ? ` (${count} ${copy.unread})` : ""}`}>
      <Bell />{count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{count > 99 ? "99+" : count}</span>}
    </Button></PopoverTrigger>
    <PopoverContent align="end" className="w-[min(380px,calc(100vw-24px))] p-0">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3"><h2 className="text-sm font-semibold">{copy.title}</h2><Button variant="ghost" size="icon" title={copy.markAll} aria-label={copy.markAll} disabled={!count || markRead.isPending} onClick={() => markRead.mutate(null)}><CheckCheck /></Button></div>
      <div className="max-h-[min(420px,60vh)] overflow-y-auto">
        {list.isPending ? <p className="p-6 text-center text-sm text-muted-foreground">{copy.loading}</p> : list.isError || unread.isError ? <div role="alert" className="p-4 text-sm"><p>{copy.error}</p><Button variant="ghost" onClick={() => { void list.refetch(); void unread.refetch(); }}>{copy.retry}</Button></div> : !list.data?.rows.length ? <p className="p-8 text-center text-sm text-muted-foreground">{copy.empty}</p> : <NotificationItems rows={list.data.rows} busy={markRead.isPending} onRead={(id) => markRead.mutate(id)} />}
      </div>
      <div className="border-t p-2"><Button variant="ghost" className="w-full" asChild><Link to="/notifications" onClick={() => setOpen(false)}>{copy.all}</Link></Button></div>
    </PopoverContent>
  </Popover>;
}