import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminHead, adminKeys, errorText, FilterSelect, ListSkeleton, SearchBox, useAdminDirectory } from "@/components/admin/admin-shared";
import { EmptyState } from "@/components/brand/bits";
import { CAMPAIGN_STATUS, PLATFORMS, labelOf, type CampaignStatus } from "@/lib/constants";
import { formatBDT, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/campaigns")({ head: () => adminHead("Campaigns", "Oversee brand campaigns and campaign status on BrandLinks."), component: AdminCampaigns });
function AdminCampaigns() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const directory = useAdminDirectory();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");
  const campaigns = useQuery({ queryKey: adminKeys.campaigns, queryFn: async () => {
    const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }});
  const update = useMutation({ mutationFn: async ({ id, status }: { id: string; status: CampaignStatus }) => {
    const { error } = await supabase.from("campaigns").update({ status }).eq("id", id).select("id").single();
    if (error) throw error;
  }, onSuccess: () => { toast.success(t("adm.updated")); qc.invalidateQueries({ queryKey: adminKeys.all }); }, onError: e => toast.error(errorText(e)) });
  const options = Object.entries(CAMPAIGN_STATUS).map(([value, s]) => ({ value: value as CampaignStatus, label: s.label[lang] }));
  const rows = (campaigns.data ?? []).filter(c => (filter === "all" || c.status === filter) && `${c.title} ${directory.data?.businessesByUser.get(c.business_id)?.company_name ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div><p className="mb-4 text-sm text-muted-foreground">{t("adm.campSub")}</p><div className="mb-4 flex flex-col gap-2 sm:flex-row"><SearchBox value={search} onChange={setSearch} placeholder={t("adm.searchCampaigns")} /><FilterSelect value={filter} onChange={setFilter} label={t("common.status")} options={[{ value: "all", label: t("adm.all") }, ...options]} /></div>
    {campaigns.error && <p role="alert" className="mb-4 text-destructive">{errorText(campaigns.error)}</p>}
    {campaigns.isLoading ? <ListSkeleton /> : rows.length === 0 ? <EmptyState title={t("common.none")} /> : <div className="space-y-3">{rows.map(c => <article key={c.id} className="surface-card p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div className="min-w-0"><h2 className="break-words font-semibold">{c.title}</h2><p className="text-sm text-muted-foreground">{directory.data?.businessesByUser.get(c.business_id)?.company_name ?? t("adm.brand")}</p></div><div aria-busy={update.isPending} className={update.isPending ? "pointer-events-none opacity-60" : ""}><FilterSelect value={c.status} onChange={status => update.mutate({ id: c.id, status })} label={`${t("common.status")}: ${c.title}`} options={options} /></div></div><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"><span>{t("adm.budget")}: <strong>{formatBDT(c.budget_bdt, lang)}</strong></span><span className="text-muted-foreground">{formatDate(c.start_date, lang)} — {formatDate(c.end_date, lang)}</span><span>{c.platforms.map(p => labelOf(PLATFORMS, p, lang)).join(" · ")}</span></div>{c.brief && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">{c.brief}</p>}</article>)}</div>}
  </div>;
}
