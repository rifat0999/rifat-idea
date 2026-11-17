import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, CalendarClock, Coins, Megaphone, Receipt, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys, errorText } from "@/components/admin/admin-shared";
import { StatCard } from "@/components/brand/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { formatBDT, localizeDigits } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin overview | BrandLinks" }, { name: "robots", content: "noindex" }] }),
  component: AdminOverview,
});

function countOf(res: { count: number | null; error: unknown }) {
  if (res.error) throw res.error;
  return res.count ?? 0;
}

function AdminOverview() {
  const { t, lang } = useI18n();
  const overview = useQuery({
    queryKey: adminKeys.overview,
    queryFn: async () => {
      const head = { count: "exact" as const, head: true };
      const [users, verif, campaigns, pendingBookings, payments, money] = await Promise.all([
        supabase.rpc("admin_list_users"),
        supabase.from("verification_requests").select("id", head).eq("status", "pending"),
        supabase.from("campaigns").select("id", head).eq("status", "active"),
        supabase.from("bookings").select("id", head).eq("status", "pending"),
        supabase.from("payments").select("id", head).eq("status", "submitted"),
        supabase.from("bookings").select("amount_bdt, commission_bdt").in("payment_status", ["verified", "released"]),
      ]);
      if (users.error) throw users.error;
      if (money.error) throw money.error;
      return {
        users: users.data?.length ?? 0,
        pendingVerif: countOf(verif),
        activeCampaigns: countOf(campaigns),
        pendingBookings: countOf(pendingBookings),
        paymentsToCheck: countOf(payments),
        volume: (money.data ?? []).reduce((s, b) => s + b.amount_bdt, 0),
        revenue: (money.data ?? []).reduce((s, b) => s + b.commission_bdt, 0),
      };
    },
  });

  const d = overview.data;
  const n = (v: number | undefined) => (v === undefined ? "—" : localizeDigits(v, lang));

  const queue = d
    ? [
        { count: d.pendingVerif, label: t("adm.pendingVerif"), to: "/admin/verification" as const },
        { count: d.paymentsToCheck, label: t("adm.pendingPay"), to: "/admin/bookings" as const },
        { count: d.pendingBookings, label: t("adm.pendingBookings"), to: "/admin/bookings" as const },
      ].filter((q) => q.count > 0)
    : [];

  return (
    <div className="space-y-8">
      {overview.error && <p className="text-sm text-destructive">{errorText(overview.error)}</p>}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label={t("adm.totalUsers")} value={n(d?.users)} icon={<Users />} />
        <StatCard label={t("adm.pendingVerif")} value={n(d?.pendingVerif)} icon={<BadgeCheck />} />
        <StatCard label={t("adm.activeCampaigns")} value={n(d?.activeCampaigns)} icon={<Megaphone />} />
        <StatCard label={t("adm.pendingPay")} value={n(d?.paymentsToCheck)} icon={<Receipt />} />
        <StatCard label={t("adm.gmv")} value={d ? formatBDT(d.volume, lang) : "—"} icon={<Wallet />} />
        <StatCard label={t("adm.revenue")} value={d ? formatBDT(d.revenue, lang) : "—"} icon={<Coins />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <CalendarClock className="size-5 text-primary" /> {t("adm.needsAttention")}
          </h2>
          {queue.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{overview.isLoading ? t("common.loading") : t("adm.allClear")}</p>
          ) : (
            <ul className="mt-4 divide-y">
              {queue.map((q) => (
                <li key={q.label} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm">
                    <span className="mr-2 inline-flex min-w-7 items-center justify-center rounded-full bg-warning/20 px-2 py-0.5 text-xs font-bold text-warning-foreground">
                      {localizeDigits(q.count, lang)}
                    </span>
                    {q.label}
                  </span>
                  <Button variant="soft" size="sm" asChild>
                    <Link to={q.to}>{t("adm.viewQueue")}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <SettingsCard />
      </div>
    </div>
  );
}

function SettingsCard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: adminKeys.settings,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("commission_rate, payment_instructions")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const [rate, setRate] = useState("");
  const [instructions, setInstructions] = useState("");
  useEffect(() => {
    if (settings.data) {
      setRate(String(settings.data.commission_rate));
      setInstructions(settings.data.payment_instructions);
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const value = Number(rate);
      if (!Number.isFinite(value) || value < 0 || value > 50) throw new Error("Commission must be between 0 and 50%");
      const { error } = await supabase
        .from("platform_settings")
        .update({ commission_rate: value, payment_instructions: instructions.trim(), updated_by: user?.id ?? null })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("adm.settingsSaved"));
      qc.invalidateQueries({ queryKey: adminKeys.settings });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  return (
    <section className="surface-card p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold">{t("adm.settings")}</h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="commission">{t("adm.commission")}</Label>
          <Input
            id="commission"
            type="number"
            min={0}
            max={50}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="max-w-32"
            disabled={settings.isLoading}
          />
          <p className="text-xs text-muted-foreground">{t("adm.commissionDesc")}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instructions">{t("adm.instructions")}</Label>
          <Textarea
            id="instructions"
            rows={4}
            maxLength={2000}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            disabled={settings.isLoading}
          />
        </div>
        <Button type="submit" variant="hero" disabled={save.isPending || settings.isLoading}>
          {t("common.save")}
        </Button>
      </form>
    </section>
  );
}
