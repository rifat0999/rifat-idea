import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, BadgeCheck, CreditCard, LineChart, Lock, Search, Send, ShieldCheck, Sparkles, Users } from "lucide-react";
import heroImg from "@/assets/hero-creator.jpg";
import { getHomeData } from "@/lib/public.functions";
import { useI18n } from "@/lib/i18n";
import { formatCompact, localizeDigits } from "@/lib/format";
import { NICHES, PLATFORMS, type Platform } from "@/lib/constants";
import { CreatorCard } from "@/components/brand/creator-card";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const homeQuery = queryOptions({ queryKey: ["home"], queryFn: () => getHomeData() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BrandLinks — Brands Meet Influencers | Bangladesh" },
      { name: "description", content: "Find and book verified Facebook, Instagram, YouTube and TikTok influencers in Bangladesh. Transparent packages in BDT." },
      { property: "og:title", content: "BrandLinks — Brands Meet Influencers" },
      { property: "og:description", content: "Bangladesh's influencer marketplace. Book verified creators in BDT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState<string>("any");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/influencers",
      search: { q: q.trim() || undefined, platform: platform === "any" ? undefined : (platform as Platform) },
    });
  }

  const steps = [
    { icon: <Search />, t: t("home.how.1.t"), d: t("home.how.1.d") },
    { icon: <Send />, t: t("home.how.2.t"), d: t("home.how.2.d") },
    { icon: <CreditCard />, t: t("home.how.3.t"), d: t("home.how.3.d") },
    { icon: <LineChart />, t: t("home.how.4.t"), d: t("home.how.4.d") },
  ];

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
        <div className="page-container relative grid items-center gap-10 py-12 md:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-semibold text-accent-foreground shadow-sm backdrop-blur">
              <Sparkles className="size-3.5 text-primary" /> {t("home.badge")}
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
              {t("home.title1")} <span className="text-gradient-primary">{t("home.title2")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">{t("home.subtitle")}</p>

            <form onSubmit={submit} className="mt-8 flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-elegant sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  maxLength={80}
                  placeholder={t("home.searchPlaceholder")}
                  className="h-12 border-0 pl-9 shadow-none focus-visible:ring-0"
                  aria-label={t("common.search")}
                />
              </div>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="h-12 border-0 bg-muted shadow-none sm:w-44" aria-label={t("dir.platform")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t("home.anyPlatform")}</SelectItem>
                  {PLATFORMS.slice(0, 5).map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" variant="hero" size="lg" className="h-12">
                {t("home.search")} <ArrowRight />
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("home.popular")}</span>
              {["fashion", "food", "tech", "beauty", "travel"].map((n) => (
                <Link key={n} to="/influencers" search={{ niche: n }} className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary">
                  {NICHES.find((x) => x.value === n)?.label[lang]}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-primary opacity-20 blur-2xl" />
            <img
              src={heroImg}
              alt="Bangladeshi creator filming content in her studio"
              width={1280}
              height={1440}
              className="relative aspect-[8/9] w-full rounded-[1.75rem] object-cover shadow-elegant"
            />
            <div className="absolute -left-3 bottom-8 animate-float rounded-2xl border bg-card/95 p-3 shadow-elegant backdrop-blur sm:-left-8">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-success/15 text-success"><BadgeCheck className="size-5" /></span>
                <div>
                  <p className="text-xs text-muted-foreground">{t("home.stat.creators")}</p>
                  <p className="font-display font-bold">{localizeDigits(data.verifiedCount, lang)}+</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-2 top-8 animate-float rounded-2xl border bg-card/95 p-3 shadow-elegant backdrop-blur [animation-delay:1.5s] sm:-right-6">
              <p className="text-xs text-muted-foreground">{t("home.stat.reach")}</p>
              <p className="font-display text-lg font-bold text-primary">{formatCompact(data.totalReach, lang)}</p>
              <div className="mt-1 flex gap-1 text-primary">
                {(["facebook", "instagram", "youtube", "tiktok"] as Platform[]).map((p) => <PlatformIcon key={p} platform={p} className="size-3.5" />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y bg-card">
        <div className="page-container grid grid-cols-3 divide-x py-6 text-center">
          <Stat value={`${localizeDigits(data.verifiedCount, lang)}+`} label={t("home.stat.creators")} />
          <Stat value={formatCompact(data.totalReach, lang)} label={t("home.stat.reach")} />
          <Stat value={localizeDigits(data.divisions, lang)} label={t("home.stat.divisions")} />
        </div>
      </section>

      {/* FEATURED */}
      <section className="page-container py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">{t("home.featured")}</h2>
            <p className="mt-2 text-muted-foreground">{t("home.featuredSub")}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/influencers">{t("home.viewAll")} <ArrowRight /></Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.featured.map((c) => <CreatorCard key={c.id} creator={c} />)}
        </div>
      </section>

      {/* HOW */}
      <section className="bg-secondary/60 py-16">
        <div className="page-container">
          <h2 className="text-center font-display text-3xl font-bold">{t("home.how")}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.t} className="surface-card relative p-6">
                <span className="absolute right-5 top-4 font-display text-4xl font-extrabold text-accent">{localizeDigits(i + 1, lang)}</span>
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow [&_svg]:size-5">{s.icon}</span>
                <h3 className="mt-4 font-display text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NICHES */}
      <section className="page-container py-16">
        <h2 className="font-display text-3xl font-bold">{t("home.niches")}</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {NICHES.map((n) => (
            <Link key={n.value} to="/influencers" search={{ niche: n.value }} className="rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary">
              {n.label[lang]}
            </Link>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section className="page-container">
        <div className="grid gap-8 overflow-hidden rounded-3xl bg-gradient-navy p-8 text-navy-foreground sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold">{t("home.trust.t")}</h2>
            <div className="mt-6 flex flex-col gap-4">
              {[
                { icon: <ShieldCheck />, text: t("home.trust.1") },
                { icon: <Lock />, text: t("home.trust.2") },
                { icon: <Users />, text: t("home.trust.3") },
              ].map((x) => (
                <div key={x.text} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-foreground/10 text-primary-glow [&_svg]:size-4">{x.icon}</span>
                  <p className="text-sm text-navy-foreground/80">{x.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-navy-foreground/5 p-6 ring-1 ring-navy-foreground/10">
            <h3 className="font-display text-2xl font-bold">{t("home.cta.t")}</h3>
            <p className="mt-2 text-sm text-navy-foreground/75">{t("home.cta.d")}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button variant="onDark" size="lg" asChild>
                <Link to="/auth" search={{ mode: "signup", role: "creator" }}>{t("home.cta.btn")}</Link>
              </Button>
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth" search={{ mode: "signup", role: "business" }}>{t("home.cta.brand")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2">
      <p className="font-display text-2xl font-extrabold text-primary sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}
