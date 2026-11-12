import { BadgeCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  VERIFICATION,
  type BookingStatus,
  type PaymentStatus,
  type VerificationStatus,
} from "@/lib/constants";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CreatorAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        width={160}
        height={160}
        className={cn("size-12 shrink-0 rounded-full object-cover ring-2 ring-card", className)}
      />
    );
  }
  return (
    <span
      aria-label={name}
      className={cn(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-primary font-display font-bold uppercase text-primary-foreground ring-2 ring-card",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function VerifiedTick({ className }: { className?: string }) {
  return <BadgeCheck className={cn("size-4 fill-primary text-primary-foreground", className)} aria-label="Verified" />;
}

export function RatingStars({ value, count, className }: { value: number; count?: number; className?: string }) {
  const { lang } = useI18n();
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star className="size-4 fill-star text-star" aria-hidden="true" />
      <span className="font-semibold text-foreground">{value > 0 ? Number(value).toFixed(1) : "—"}</span>
      {count !== undefined && (
        <span className="text-muted-foreground">({lang === "bn" ? String(count).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d] ?? d) : count})</span>
      )}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star`}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star className={cn("size-7", n <= value ? "fill-star text-star" : "text-border")} />
        </button>
      ))}
    </div>
  );
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { lang } = useI18n();
  const s = BOOKING_STATUS[status];
  return <Badge variant={s.tone}>{s.label[lang]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { lang } = useI18n();
  const s = PAYMENT_STATUS[status];
  return <Badge variant={s.tone}>{s.label[lang]}</Badge>;
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { lang } = useI18n();
  const s = VERIFICATION[status];
  return (
    <Badge variant={s.tone}>
      {status === "verified" && <BadgeCheck />}
      {s.label[lang]}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-4">{icon}</span>}
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/50 px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}

export function PageHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
