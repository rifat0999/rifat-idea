import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, History, Receipt, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  adminHead,
  adminKeys,
  errorText,
  FilterSelect,
  ListSkeleton,
  SearchBox,
} from "@/components/admin/admin-shared";
import { EmptyState } from "@/components/brand/bits";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => adminHead("Audit log", "See who changed verification, booking and payment statuses, and when."),
  component: AdminAuditLog,
});

type AuditEntry = Database["public"]["Tables"]["admin_audit_logs"]["Row"];
type AuditCategory = "verification" | "booking" | "payment";
type AuditStatusField = "status" | "verification_status" | "payment_status";
type CategoryFilter = "all" | AuditCategory;

const categoryIcons = {
  verification: BadgeCheck,
  booking: ShieldCheck,
  payment: Receipt,
};

function AdminAuditLog() {
  const { t, lang } = useI18n();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");

  const audit = useQuery({
    queryKey: adminKeys.audit,
    queryFn: async () => {
      const [entries, users] = await Promise.all([
        supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.rpc("admin_list_users"),
      ]);
      if (entries.error) throw entries.error;
      if (users.error) throw users.error;
      const actorNames = new Map((users.data ?? []).map((user) => [user.id, user.full_name ?? user.email]));
      return { entries: entries.data ?? [], actorNames };
    },
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (audit.data?.entries ?? []).filter((entry) => {
      if (category !== "all" && entry.category !== category) return false;
      if (!term) return true;
      const actor = entry.actor_id ? audit.data?.actorNames.get(entry.actor_id) : t("adm.auditSystem");
      return [actor, entry.entity_label, entry.old_status, entry.new_status]
        .some((value) => value?.toLowerCase().includes(term));
    });
  }, [audit.data, category, search, t]);

  const categoryLabel = (value: AuditCategory) => t(`adm.auditCategory.${value}` as const);
  const fieldLabel = (value: AuditStatusField) => t(`adm.auditField.${value}` as const);

  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <History className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold">{t("adm.audit")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("adm.auditSub")}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchBox value={search} onChange={setSearch} placeholder={t("adm.auditSearch")} />
        <FilterSelect<CategoryFilter>
          value={category}
          onChange={setCategory}
          label={t("adm.auditType")}
          options={[
            { value: "all", label: t("adm.all") },
            { value: "verification", label: categoryLabel("verification") },
            { value: "booking", label: categoryLabel("booking") },
            { value: "payment", label: categoryLabel("payment") },
          ]}
        />
      </div>

      {audit.error && <p role="alert" className="mb-4 text-sm text-destructive">{errorText(audit.error)}</p>}
      {audit.isLoading ? (
        <ListSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title={t("adm.auditEmpty")} />
      ) : (
        <div className="space-y-3">
          {rows.map((entry) => {
            const entryCategory = entry.category as AuditCategory;
            const Icon = categoryIcons[entryCategory];
            const actor = entry.actor_id
              ? audit.data?.actorNames.get(entry.actor_id) ?? t("adm.auditUnknown")
              : t("adm.auditSystem");
            return (
              <article key={entry.id} className="surface-card p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="soft">{categoryLabel(entryCategory)}</Badge>
                        <span className="text-xs text-muted-foreground">{fieldLabel(entry.status_field as AuditStatusField)}</span>
                      </div>
                      <h3 className="mt-2 break-words font-semibold">{entry.entity_label}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">{entry.old_status ?? "—"}</span>
                        <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                        <span className="rounded-md bg-accent px-2 py-1 font-medium text-primary">{entry.new_status}</span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {t("adm.auditChangedBy")} <span className="font-medium text-foreground">{actor}</span>
                      </p>
                    </div>
                  </div>
                  <time dateTime={entry.created_at} className="shrink-0 text-xs text-muted-foreground sm:text-right">
                    {formatDateTime(entry.created_at, lang)}
                  </time>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
