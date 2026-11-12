import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, Check, ExternalLink, Eye, Languages, MapPin, MessageCircle, Star, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { getCreatorBySlug, type CreatorDetail } from "@/lib/public.functions";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { openConversation } from "@/lib/conversations";
import { formatBDT, formatCompact, formatDate, localizeDigits } from "@/lib/format";
import { LOCATIONS, NICHES, PLATFORMS, labelOf, type Platform } from "@/lib/constants";
import { CreatorAvatar, RatingStars, VerificationBadge, VerifiedTick } from "@/components/brand/bits";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const creatorQuery = (slug: string) =>
  queryOptions({
    queryKey: ["creator", slug],
    queryFn: async () => {
      const d = await getCreatorBySlug({ data: { slug } });
      if (!d) throw notFound();
      return d;
    },
  });

export const Route = createFileRoute("/influencers/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(creatorQuery(params.slug)),
  head: ({ loaderData }) => {
    const c = loaderData?.creator;
    const title = c ? `${c.display_name} — Influencer in ${c.location} | BrandLinks` : "Creator unavailable | BrandLinks";
    const desc = c?.headline ?? "Influencer profile on BrandLinks.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
        ...(c ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: CreatorPage,
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => <div role="alert" className="page-container py-16 text-destructive">{error.message}</div>,
});

function NotFound() {
  const { t } = useI18n();
  return (
    <div className="page-container py-20 text-center">
      <p className="text-muted-foreground">{t("profile.notFound")}</p>
      <Button className="mt-4" variant="outline" asChild><Link to="/influencers">{t("nav.find")}</Link></Button>
    </div>
  );
}

function CreatorPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(creatorQuery(slug));
  const { creator, socials, packages, reviews } = data;
  const { t, lang, pick } = useI18n();

  return (
    <main className="pb-10">
      <div className="h-40 bg-gradient-primary sm:h-52">
        <div className="size-full bg-grid opacity-30" />
      </div>
      <div className="page-container">
        <div className="-mt-16 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6">
            {/* Identity */}
            <section className="surface-card p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <CreatorAvatar name={creator.display_name} src={creator.avatar_url} className="size-28 text-3xl ring-4 sm:size-32" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{creator.display_name}</h1>
                    {creator.verification_status === "verified" && <VerifiedTick className="size-6" />}
                  </div>
                  <p className="mt-1 text-muted-foreground">{pick(creator.headline, creator.headline_bn)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="size-4" />{labelOf(LOCATIONS, creator.location, lang)}</span>
                    <VerificationBadge status={creator.verification_status} />
                    {creator.niches.map((n) => <Badge key={n} variant="soft">{labelOf(NICHES, n, lang)}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric icon={<Users />} label={t("profile.totalReach")} value={formatCompact(creator.total_followers, lang)} />
                <Metric icon={<TrendingUp />} label={t("profile.avgEngagement")} value={`${localizeDigits(Number(creator.avg_engagement).toFixed(1), lang)}%`} />
                <Metric icon={<Star />} label={t("profile.rating")} value={Number(creator.rating_avg) > 0 ? localizeDigits(Number(creator.rating_avg).toFixed(1), lang) : "—"} />
                <Metric icon={<Languages />} label={t("profile.languages")} value={creator.languages.map((l) => (l === "bn" ? "বাংলা" : "English")).join(" · ")} />
              </div>
            </section>

            {/* About */}
            <section className="surface-card p-5 sm:p-7">
              <h2 className="font-display text-lg font-bold">{t("profile.about")}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">{pick(creator.bio, creator.bio_bn) || "—"}</p>
            </section>

            {/* Socials */}
            <section className="surface-card p-5 sm:p-7">
              <h2 className="font-display text-lg font-bold">{t("profile.socials")}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {socials.map((s) => (
                  <a key={s.id} href={s.url ?? undefined} target="_blank" rel="noopener noreferrer nofollow"
                    className="group flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-primary">
                    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                      <PlatformIcon platform={s.platform as Platform} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 truncate text-sm font-semibold">{s.handle}{s.url && <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100" />}</p>
                      <p className="text-xs text-muted-foreground">{labelOf(PLATFORMS, s.platform, lang)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold">{formatCompact(s.followers, lang)}</p>
                      <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground"><Eye className="size-3" />{formatCompact(s.avg_views, lang)} · {localizeDigits(Number(s.engagement_rate).toFixed(1), lang)}%</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            <Audience audience={creator.audience as AudienceData} />

            {/* Packages */}
            <section id="packages" className="surface-card p-5 sm:p-7">
              <h2 className="font-display text-lg font-bold">{t("profile.packages")}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {packages.map((p) => (
                  <div key={p.id} className="flex flex-col rounded-xl border p-5 transition-shadow hover:shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-primary"><PlatformIcon platform={p.platform as Platform} className="size-3.5" />{labelOf(PLATFORMS, p.platform, lang)}</p>
                        <h3 className="mt-1 font-display font-bold">{pick(p.title, p.title_bn)}</h3>
                      </div>
                      <p className="whitespace-nowrap font-display text-lg font-extrabold text-primary">{formatBDT(p.price_bdt, lang)}</p>
                    </div>
                    {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {p.deliverables.map((d) => <li key={d} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-success" />{d}</li>)}
                    </ul>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" />{localizeDigits(p.delivery_days, lang)} {t("profile.days")}</p>
                    <div className="mt-4"><BookButton slug={creator.slug} packageId={p.id} creatorUserId={creator.user_id} className="w-full" /></div>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section className="surface-card p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">{t("profile.reviews")}</h2>
                <RatingStars value={Number(creator.rating_avg)} count={creator.rating_count} />
              </div>
              {reviews.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">{t("profile.noReviews")}</p>
              ) : (
                <div className="mt-4 flex flex-col divide-y">
                  {reviews.map((r) => (
                    <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CreatorAvatar name={r.company} src={r.logo} className="size-8 text-xs" />
                          <p className="text-sm font-semibold">{r.company}</p>
                        </div>
                        <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={i < r.rating ? "size-3.5 fill-star text-star" : "size-3.5 text-border"} />)}</div>
                      </div>
                      {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.created_at, lang)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:pt-20">
            <div className="surface-card sticky top-24 p-5">
              <p className="text-sm text-muted-foreground">{t("profile.startingAt")}</p>
              <p className="font-display text-3xl font-extrabold text-primary">{formatBDT(creator.starting_price, lang)}</p>
              <div className="mt-5 flex flex-col gap-2">
                <BookButton slug={creator.slug} creatorUserId={creator.user_id} size="lg" />
                <MessageButton creatorId={creator.id} creatorUserId={creator.user_id} />
              </div>
              <div className="mt-5 flex flex-col gap-2 border-t pt-4 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Check className="size-3.5 text-success" />{t("home.trust.2")}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">{icon}{label}</p>
      <p className="mt-1 truncate font-display text-lg font-bold">{value}</p>
    </div>
  );
}

type AudienceData = { gender?: { female?: number; male?: number }; age?: Record<string, number>; top_cities?: string[] };

function Audience({ audience }: { audience: AudienceData }) {
  const { t, lang } = useI18n();
  if (!audience || (!audience.gender && !audience.age)) return null;
  const female = audience.gender?.female ?? 0;
  return (
    <section className="surface-card p-5 sm:p-7">
      <h2 className="font-display text-lg font-bold">{t("profile.audience")}</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("profile.gender")}</p>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-accent">
            <div className="bg-primary" style={{ width: `${female}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span><span className="font-bold">{localizeDigits(female, lang)}%</span> {t("profile.female")}</span>
            <span><span className="font-bold">{localizeDigits(100 - female, lang)}%</span> {t("profile.male")}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("profile.age")}</p>
          <div className="mt-3 flex flex-col gap-2">
            {Object.entries(audience.age ?? {}).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span className="w-12 text-muted-foreground">{localizeDigits(k, lang)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent"><div className="h-full rounded-full bg-gradient-primary" style={{ width: `${v}%` }} /></div>
                <span className="w-9 text-right font-semibold">{localizeDigits(v, lang)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("profile.cities")}</p>
          <ol className="mt-3 flex flex-col gap-2">
            {(audience.top_cities ?? []).map((c, i) => (
              <li key={c} className="flex items-center gap-2 text-sm">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{localizeDigits(i + 1, lang)}</span>
                {labelOf(LOCATIONS, c, lang) || c}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function BookButton({ slug, packageId, creatorUserId, className, size }: { slug: string; packageId?: string; creatorUserId: string; className?: string; size?: "lg" }) {
  const { t } = useI18n();
  const { user, isCreator } = useAuth();
  if (user?.id === creatorUserId || isCreator) return null;
  if (!user) {
    return (
      <Button variant="hero" size={size} className={className} asChild>
        <Link to="/auth" search={{ mode: "signin", redirect: `/book/${slug}` }}>{t("profile.book")}</Link>
      </Button>
    );
  }
  return (
    <Button variant="hero" size={size} className={className} asChild>
      <Link to="/book/$slug" params={{ slug }} search={{ package: packageId }}>{t("profile.book")}</Link>
    </Button>
  );
}

function MessageButton({ creatorId, creatorUserId }: { creatorId: string; creatorUserId: CreatorDetail["creator"]["user_id"] }) {
  const { t } = useI18n();
  const { user, isBusiness } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  if (user?.id === creatorUserId) return null;
  if (!user) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary">{t("nav.signin")}</Link> — {t("profile.signInToBook")}
      </p>
    );
  }
  if (!isBusiness) return null;
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const id = await openConversation(user.id, creatorId);
          navigate({ to: "/messages", search: { c: id } });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : t("common.error"));
        } finally {
          setBusy(false);
        }
      }}
    >
      <MessageCircle /> {t("profile.message")}
    </Button>
  );
}
