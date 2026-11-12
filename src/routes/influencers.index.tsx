import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { directorySearchSchema, listCreators, type DirectorySearch } from "@/lib/public.functions";
import { useI18n } from "@/lib/i18n";
import { localizeDigits } from "@/lib/format";
import { BUDGET_RANGES, FOLLOWER_RANGES, LOCATIONS, NICHES, PLATFORMS } from "@/lib/constants";
import { CreatorCard } from "@/components/brand/creator-card";
import { EmptyState } from "@/components/brand/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const creatorsQuery = (s: DirectorySearch) =>
  queryOptions({ queryKey: ["creators", s], queryFn: () => listCreators({ data: s }) });

export const Route = createFileRoute("/influencers/")({
  validateSearch: (search: Record<string, unknown>): DirectorySearch => {
    const r = directorySearchSchema.safeParse(search);
    return r.success ? r.data : {};
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(creatorsQuery(deps)),
  head: () => ({
    meta: [
      { title: "Find influencers in Bangladesh | BrandLinks" },
      { name: "description", content: "Filter Bangladeshi creators by platform, followers, division, niche and budget in BDT." },
      { property: "og:title", content: "Find influencers in Bangladesh | BrandLinks" },
      { property: "og:description", content: "Filter creators by platform, followers, location, niche and budget." },
    ],
  }),
  component: Directory,
  errorComponent: ({ error }) => <div role="alert" className="page-container py-16 text-destructive">{error.message}</div>,
});

function Directory() {
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(creatorsQuery(search));
  const { t, lang } = useI18n();
  const navigate = useNavigate({ from: "/influencers/" });
  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => setQ(search.q ?? ""), [search.q]);

  const set = (patch: Partial<DirectorySearch>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const activeCount = [search.platform, search.niche, search.location, search.minFollowers, search.maxBudget, search.verified].filter(Boolean).length;

  const filters = (
    <div className="flex flex-col gap-5">
      <FilterSelect label={t("dir.platform")} value={search.platform} onChange={(v) => set({ platform: v as DirectorySearch["platform"] })}
        options={PLATFORMS.map((p) => ({ value: p.value, label: p.label[lang] }))} anyLabel={t("dir.any")} />
      <FilterSelect label={t("dir.followers")} value={search.minFollowers?.toString()} onChange={(v) => set({ minFollowers: v ? Number(v) : undefined })}
        options={FOLLOWER_RANGES.map((p) => ({ value: String(p.value), label: p.label[lang] }))} anyLabel={t("dir.any")} />
      <FilterSelect label={t("dir.location")} value={search.location} onChange={(v) => set({ location: v })}
        options={LOCATIONS.map((p) => ({ value: p.value, label: p.label[lang] }))} anyLabel={t("dir.any")} />
      <FilterSelect label={t("dir.niche")} value={search.niche} onChange={(v) => set({ niche: v })}
        options={NICHES.map((p) => ({ value: p.value, label: p.label[lang] }))} anyLabel={t("dir.any")} />
      <FilterSelect label={t("dir.budget")} value={search.maxBudget?.toString()} onChange={(v) => set({ maxBudget: v ? Number(v) : undefined })}
        options={BUDGET_RANGES.map((p) => ({ value: String(p.value), label: p.label[lang] }))} anyLabel={t("dir.any")} />
      <div className="flex items-center justify-between rounded-lg border bg-card p-3">
        <Label htmlFor="verified" className="text-sm">{t("dir.verifiedOnly")}</Label>
        <Switch id="verified" checked={!!search.verified} onCheckedChange={(c) => set({ verified: c || undefined })} />
      </div>
      {activeCount > 0 && (
        <Button variant="ghost" asChild>
          <Link to="/influencers" search={{}}><X /> {t("dir.clear")}</Link>
        </Button>
      )}
    </div>
  );

  return (
    <main>
      <section className="border-b bg-gradient-hero">
        <div className="page-container py-10">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{t("dir.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("dir.subtitle")}</p>
          <form
            onSubmit={(e) => { e.preventDefault(); set({ q: q.trim() || undefined }); }}
            className="mt-6 flex max-w-2xl gap-2 rounded-xl border bg-card p-1.5 shadow-card"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} placeholder={t("home.searchPlaceholder")} className="h-11 border-0 pl-9 shadow-none focus-visible:ring-0" aria-label={t("common.search")} />
            </div>
            <Button type="submit" variant="hero" className="h-11">{t("common.search")}</Button>
          </form>
        </div>
      </section>

      <div className="page-container grid gap-8 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-4 flex items-center gap-2 font-display font-bold"><SlidersHorizontal className="size-4" /> {t("dir.filters")}</p>
            {filters}
          </div>
        </aside>
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{localizeDigits(data.length, lang)}</span> {t("dir.results")}
            </p>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal /> {t("dir.filters")}
                    {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{localizeDigits(activeCount, lang)}</span>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader><SheetTitle>{t("dir.filters")}</SheetTitle></SheetHeader>
                  <div className="px-4 pb-6">{filters}</div>
                </SheetContent>
              </Sheet>
              <Select value={search.sort ?? "popular"} onValueChange={(v) => set({ sort: v === "popular" ? undefined : (v as DirectorySearch["sort"]) })}>
                <SelectTrigger className="w-48" aria-label={t("dir.sort")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["popular", "rating", "price_low", "price_high"] as const).map((s) => (
                    <SelectItem key={s} value={s}>{t(`dir.sort.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {data.length === 0 ? (
            <EmptyState title={t("dir.empty")} action={<Button variant="outline" asChild><Link to="/influencers" search={{}}>{t("dir.clear")}</Link></Button>} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {data.map((c) => <CreatorCard key={c.id} creator={c} />)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterSelect({
  label, value, onChange, options, anyLabel,
}: {
  label: string; value?: string; onChange: (v: string | undefined) => void;
  options: { value: string; label: string }[]; anyLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Select value={value ?? "any"} onValueChange={(v) => onChange(v === "any" ? undefined : v)}>
        <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">{anyLabel}</SelectItem>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
