import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { adminHead, adminKeys, errorText, FilterSelect, ListSkeleton, safeExternalUrl, useAdminDirectory } from "@/components/admin/admin-shared";
import { EmptyState } from "@/components/brand/bits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { REQUEST_STATUS, type RequestStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/verification")({
  head: () => adminHead("Verification", "Review BrandLinks brand and influencer verification requests."),
  component: AdminVerification,
});
type Request = Database["public"]["Tables"]["verification_requests"]["Row"];
function AdminVerification() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const directory = useAdminDirectory();
  const [filter, setFilter] = useState<RequestStatus | "all">("pending");
  const [selected, setSelected] = useState<Request | null>(null);
  const [note, setNote] = useState("");
  const requests = useQuery({ queryKey: adminKeys.verification, queryFn: async () => {
    const { data, error } = await supabase.from("verification_requests").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }});
  const name = (r: Request) => directory.data?.creatorsByUser.get(r.user_id)?.display_name ?? directory.data?.businessesByUser.get(r.user_id)?.company_name ?? t("adm.user");
  const review = useMutation({ mutationFn: async (status: "approved" | "rejected") => {
    if (!selected) throw new Error(t("common.error"));
    const { data, error } = await supabase.from("verification_requests").update({ status, admin_note: note.trim() || null }).eq("id", selected.id).eq("status", "pending").select("id").single();
    if (error || !data) throw error ?? new Error(t("common.error"));
    return status;
  }, onSuccess: (status) => {
    toast.success(t(status === "approved" ? "adm.approvedToast" : "adm.rejectedToast"));
    setSelected(null);
    qc.invalidateQueries({ queryKey: adminKeys.all });
  }, onError: (e) => toast.error(errorText(e)) });
  const rows = (requests.data ?? []).filter(r => filter === "all" || r.status === filter);
  const proof = safeExternalUrl(selected?.proof_url ?? null);
  return <div>
    <p className="mb-4 text-sm text-muted-foreground">{t("adm.verifSub")}</p>
    <FilterSelect value={filter} onChange={setFilter} label={t("common.status")} options={[{ value: "all", label: t("adm.all") }, ...Object.entries(REQUEST_STATUS).map(([value, s]) => ({ value: value as RequestStatus, label: s.label[lang] }))]} />
    {requests.error && <p role="alert" className="mt-4 text-destructive">{errorText(requests.error)}</p>}
    <div className="mt-4 space-y-3">{requests.isLoading ? <ListSkeleton /> : rows.length === 0 ? <EmptyState title={t("common.none")} /> : rows.map(r => {
      const status = REQUEST_STATUS[r.status as RequestStatus];
      return <article key={r.id} className="surface-card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0"><h2 className="break-words font-semibold">{name(r)}</h2><p className="text-sm text-muted-foreground">{r.kind === "creator" ? t("adm.creator") : t("adm.brand")} · {formatDate(r.created_at, lang)}</p></div>
        <div className="flex items-center gap-3"><Badge variant={status?.tone ?? "muted"}>{status?.label[lang] ?? r.status}</Badge><Button variant="outline" size="sm" onClick={() => { setSelected(r); setNote(r.admin_note ?? ""); }}>{t("adm.review")}</Button></div>
      </article>;
    })}</div>
    <Dialog open={!!selected} onOpenChange={open => { if (!open && !review.isPending) setSelected(null); }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>{selected ? name(selected) : t("adm.review")}</DialogTitle><DialogDescription>{t("adm.verification")}</DialogDescription></DialogHeader>
      {selected && <div className="space-y-4">
        <p className="whitespace-pre-wrap break-words text-sm">{selected.message || "—"}</p>
        {proof && <Button variant="outline" asChild><a href={proof} target="_blank" rel="noopener noreferrer"><ExternalLink />{t("adm.proof")}</a></Button>}
        <p className="text-sm text-muted-foreground">{t("adm.reviewedOn")}: {formatDate(selected.reviewed_at, lang)}</p>
        <div className="space-y-2"><Label htmlFor="verification-note">{t("adm.note")}</Label><Textarea id="verification-note" maxLength={2000} value={note} onChange={e => setNote(e.target.value)} disabled={selected.status !== "pending" || review.isPending} placeholder={t("adm.notePh")} /></div>
        {selected.status === "pending" && <div className="flex gap-2"><Button disabled={review.isPending} onClick={() => review.mutate("approved")}>{t("common.approve")}</Button><Button variant="destructive" disabled={review.isPending} onClick={() => review.mutate("rejected")}>{t("common.reject")}</Button></div>}
      </div>}
    </DialogContent></Dialog>
  </div>;
}
