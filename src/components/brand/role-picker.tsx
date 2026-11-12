import { Building2, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type SignupRole = "business" | "creator";

export function RolePicker({ value, onChange }: { value: SignupRole; onChange: (r: SignupRole) => void }) {
  const { t } = useI18n();
  const items: { v: SignupRole; icon: React.ReactNode; title: string; desc: string }[] = [
    { v: "business", icon: <Building2 />, title: t("auth.business"), desc: t("auth.businessDesc") },
    { v: "creator", icon: <Sparkles />, title: t("auth.creator"), desc: t("auth.creatorDesc") },
  ];
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("auth.iam")}>
      {items.map((i) => (
        <button
          key={i.v}
          type="button"
          role="radio"
          aria-checked={value === i.v}
          onClick={() => onChange(i.v)}
          className={cn(
            "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all",
            value === i.v ? "border-primary bg-accent ring-2 ring-primary/20" : "bg-card hover:border-primary/50",
          )}
        >
          <span className={cn("inline-flex size-8 items-center justify-center rounded-lg [&_svg]:size-4", value === i.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i.icon}</span>
          <span className="text-sm font-semibold leading-tight">{i.title}</span>
          <span className="text-xs text-muted-foreground">{i.desc}</span>
        </button>
      ))}
    </div>
  );
}
