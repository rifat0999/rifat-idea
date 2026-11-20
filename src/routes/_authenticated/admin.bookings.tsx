import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { adminHead, adminKeys, errorText, FilterSelect, ListSkeleton, safeExternalUrl, SearchBox, useAdminDirectory } from "@/components/admin/admin-shared";
import { BookingStatusBadge, PaymentStatusBadge, EmptyState } from "@/components/brand/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, labelOf, type BookingStatus, type PaymentStatus } from "@/lib/constants";
import { formatBDT, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
export const Route = createFileRoute("/_authenticated/admin/bookings")({ head: () => adminHead("Bookings", "Manage BrandLinks bookings and verify manually transferred payments."), component: AdminBookings });
type Booking = Database["public"]["Tables"]["bookings"]["Row"];
function AdminBookings() {
  const { t, lang } = useI18n();
  const directory = useAdminDirectory();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const bookings = useQuery({ queryKey: adminKeys.bookings, queryFn: async () => {
    const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }});
  const brand = (b: Booking) => directory.data?.businessesByUser.get(b.business_id)?.company_name ?? t("adm.brand");
  const creator = (b: Booking) => directory.data?.creatorsByUser.get(b.creator_user_id)?.display_name ?? t("adm.creator");
  const rows = (bookings.data ?? []).filter(b => (filter === "all" || b.status === filter) && (paymentFilter === "all" || b.payment_status === paymentFilter) && `${b.title} ${brand(b)} ${creator(b)}`.toLowerCase().includes(search.trim().toLowerCase()));
  const booking = bookings.data?.find(b => b.id === selected);
  return <div><p className="mb-4 text-sm text-muted-foreground">{t("adm.bookSub")}</p><div className="mb-4 flex flex-wrap gap-2"><SearchBox value={search} onChange={setSearch} placeholder={t("adm.searchBookings")} /><FilterSelect value={filter} onChange={setFilter} label={t("adm.bookingStatus")} options={[{ value: "all", label: t("adm.all") }, ...Object.entries(BOOKING_STATUS).map(([value,s]) => ({ value: value as BookingStatus, label: s.label[lang] }))]} /><FilterSelect value={paymentFilter} onChange={setPaymentFilter} label={t("adm.paymentStatus")} options={[{ value: "all", label: t("adm.payments") }, ...Object.entries(PAYMENT_STATUS).map(([value,s]) => ({ value: value as PaymentStatus, label: s.label[lang] }))]} /></div>
    {bookings.error && <p role="alert" className="text-destructive">{errorText(bookings.error)}</p>}
    {bookings.isLoading ? <ListSkeleton /> : rows.length === 0 ? <EmptyState title={t("common.none")} /> : <div className="space-y-3">{rows.map(b => <article key={b.id} className="surface-card flex flex-wrap items-center justify-between gap-4 p-5"><div className="min-w-0"><h2 className="break-words font-semibold">{b.title}</h2><p className="break-words text-sm text-muted-foreground">{brand(b)} · {creator(b)}</p><p className="mt-1 text-sm">{formatBDT(b.amount_bdt, lang)} · {formatDate(b.created_at, lang)}</p></div><div className="flex flex-wrap items-center gap-2"><BookingStatusBadge status={b.status} /><PaymentStatusBadge status={b.payment_status} /><Button variant="outline" size="sm" onClick={() => setSelected(b.id)}>{t("adm.manage")}</Button></div></article>)}</div>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="break-words">{booking?.title ?? t("adm.manage")}</DialogTitle><DialogDescription>{booking ? `${brand(booking)} · ${creator(booking)}` : t("adm.bookings")}</DialogDescription></DialogHeader>{booking && <BookingManager key={booking.id} booking={booking} />}</DialogContent></Dialog>
  </div>;
}
function BookingManager({ booking }: { booking: Booking }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [status, setStatus] = useState(booking.status);
  const [paymentStatus, setPaymentStatus] = useState(booking.payment_status);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const payments = useQuery({ queryKey: adminKeys.payments(booking.id), queryFn: async () => {
    const { data, error } = await supabase.from("payments").select("*").eq("booking_id", booking.id).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }});
  const refresh = () => qc.invalidateQueries({ queryKey: adminKeys.all });
  const save = useMutation({ mutationFn: async () => {
    const { error } = await supabase.from("bookings").update({ status, payment_status: paymentStatus }).eq("id", booking.id).eq("updated_at", booking.updated_at).select("id").single();
    if (error) throw error;
  }, onSuccess: () => { toast.success(t("bk.updated")); refresh(); }, onError: e => toast.error(errorText(e)) });
  const review = useMutation({ mutationFn: async ({ id, status }: { id: string; status: "verified" | "rejected" }) => {
    const { error } = await supabase.from("payments").update({ status, admin_note: notes[id]?.trim() || null }).eq("id", id).eq("status", "submitted").select("id").single();
    if (error) throw error;
    return status;
  }, onSuccess: status => { setPaymentStatus(status); toast.success(t(status === "verified" ? "adm.paymentVerified" : "adm.paymentRejected")); refresh(); }, onError: e => toast.error(errorText(e)) });
  const deliverable = safeExternalUrl(booking.deliverable_url);
  return <div className="space-y-5"><dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-muted-foreground">{t("common.amount")}</dt><dd className="font-semibold">{formatBDT(booking.amount_bdt, lang)}</dd></div><div><dt className="text-muted-foreground">{t("adm.payout")}</dt><dd>{formatBDT(booking.creator_payout_bdt, lang)}</dd></div><div><dt className="text-muted-foreground">{t("book.commission")}</dt><dd>{formatBDT(booking.commission_bdt, lang)}</dd></div><div><dt className="text-muted-foreground">{t("bk.due")}</dt><dd>{formatDate(booking.due_date, lang)}</dd></div></dl>
    {booking.requirements && <p className="whitespace-pre-wrap break-words text-sm">{booking.requirements}</p>}{deliverable && <Button variant="outline" asChild><a href={deliverable} target="_blank" rel="noopener noreferrer"><ExternalLink />{t("adm.deliverable")}</a></Button>}
    <section className="space-y-3 border-t pt-4"><h3 className="font-semibold">{t("adm.paymentsSubmitted")}</h3>{payments.error && <p role="alert" className="text-destructive">{errorText(payments.error)}</p>}{payments.isLoading ? <ListSkeleton /> : payments.data?.length === 0 ? <p className="text-sm text-muted-foreground">{t("adm.noPayments")}</p> : payments.data?.map(p => <div key={p.id} className="space-y-3 border-b pb-4 text-sm"><p className="font-medium">{labelOf(PAYMENT_METHODS, p.method, lang)} · {formatBDT(p.amount_bdt, lang)} · {p.status}</p><p className="break-all">{t("adm.txn")}: {p.transaction_ref}</p><p>{t("adm.sender")}: {p.sender_account ?? "—"}</p><p className="text-muted-foreground">{formatDate(p.created_at, lang)}</p>{p.status === "submitted" ? <><Label htmlFor={`note-${p.id}`}>{t("adm.note")}</Label><Textarea id={`note-${p.id}`} maxLength={2000} value={notes[p.id] ?? ""} onChange={e => setNotes({ ...notes, [p.id]: e.target.value })} /><div className="flex flex-wrap gap-2"><Button disabled={review.isPending || save.isPending} onClick={() => review.mutate({ id: p.id, status: "verified" })}>{t("adm.verifyPayment")}</Button><Button variant="destructive" disabled={review.isPending || save.isPending} onClick={() => review.mutate({ id: p.id, status: "rejected" })}>{t("adm.rejectPayment")}</Button></div></> : <p className="whitespace-pre-wrap break-words text-muted-foreground">{p.admin_note}</p>}</div>)}</section>
    <form className="space-y-3 border-t pt-4" onSubmit={e => { e.preventDefault(); save.mutate(); }}><div className="flex flex-wrap gap-3"><div className="space-y-2"><Label>{t("adm.bookingStatus")}</Label><FilterSelect value={status} onChange={setStatus} label={t("adm.bookingStatus")} options={Object.entries(BOOKING_STATUS).map(([value,s]) => ({ value: value as BookingStatus, label: s.label[lang] }))} /></div><div className="space-y-2"><Label>{t("adm.paymentStatus")}</Label><FilterSelect value={paymentStatus} onChange={setPaymentStatus} label={t("adm.paymentStatus")} options={Object.entries(PAYMENT_STATUS).map(([value,s]) => ({ value: value as PaymentStatus, label: s.label[lang] }))} /></div></div><p className="text-xs text-muted-foreground">{t("adm.override")}</p><Button type="submit" disabled={save.isPending || review.isPending}>{t("adm.saveStatus")}</Button></form>
  </div>;
}
