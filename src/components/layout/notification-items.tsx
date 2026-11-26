import { ArrowRight, BadgeCheck, CalendarCheck, Check, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { notificationCopy, notificationStatus, type Notification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function NotificationItems({ rows, onRead, busy }: { rows: Notification[]; onRead: (id: string) => void; busy: boolean }) {
  const { lang } = useI18n();
  const copy = notificationCopy[lang];
  return <ul className="divide-y">
    {rows.map((entry) => {
      const Icon = entry.category === "verification" ? BadgeCheck : entry.category === "payment" ? Receipt : CalendarCheck;
      const category = entry.category === "verification" ? copy.verification : entry.category === "payment" ? copy.payment : copy.booking;
      return <li key={entry.id} className={cn("flex gap-3 px-4 py-4", !entry.read_at && "bg-accent/40")}>
        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><Icon className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">{category}{!entry.read_at && <span className="size-2 rounded-full bg-primary" aria-label={copy.unread} />}</div>
          <p className="mt-1 break-words text-sm font-semibold">{entry.entity_label}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">{notificationStatus(entry, entry.old_status, lang)}</span><ArrowRight className="size-3 text-muted-foreground" aria-hidden="true" /><span className="font-medium text-primary">{notificationStatus(entry, entry.new_status, lang)}</span>
          </div>
          <time dateTime={entry.created_at} className="mt-2 block text-xs text-muted-foreground">{formatDateTime(entry.created_at, lang)}</time>
        </div>
        {!entry.read_at && <Button variant="ghost" size="icon" className="size-8 shrink-0" title={copy.markRead} aria-label={copy.markRead} disabled={busy} onClick={() => onRead(entry.id)}><Check className="size-4" /></Button>}
      </li>;
    })}
  </ul>;
}