import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { CreatorCardData } from "@/lib/public.functions";
import { useI18n } from "@/lib/i18n";
import { formatBDT, formatCompact, localizeDigits } from "@/lib/format";
import { LOCATIONS, NICHES, labelOf, type Platform } from "@/lib/constants";
import { CreatorAvatar, RatingStars, VerifiedTick } from "./bits";
import { PlatformIcon } from "./platform-icon";

export function CreatorCard({ creator }: { creator: CreatorCardData }) {
  const { t, lang, pick } = useI18n();
  const socials = (creator.creator_socials ?? []) as { platform: Platform; followers: number }[];
  return (
    <Link
      to="/influencers/$slug"
      params={{ slug: creator.slug }}
      className="group surface-card flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elegant"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-hero">
        {creator.avatar_url ? (
          <img
            src={creator.avatar_url}
            alt={creator.display_name}
            loading="lazy"
            width={640}
            height={480}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-grid">
            <CreatorAvatar name={creator.display_name} className="size-24 text-3xl shadow-glow" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {socials.slice(0, 4).map((s) => (
            <span key={s.platform} className="inline-flex size-7 items-center justify-center rounded-full bg-card/95 text-primary shadow-sm backdrop-blur">
              <PlatformIcon platform={s.platform} className="size-3.5" />
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-base font-bold text-foreground">{creator.display_name}</h3>
            {creator.verification_status === "verified" && <VerifiedTick />}
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{pick(creator.headline, creator.headline_bn)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {labelOf(LOCATIONS, creator.location, lang)}
          </span>
          <span className="text-border">•</span>
          <span>{creator.niches.slice(0, 2).map((n) => labelOf(NICHES, n, lang)).join(", ")}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-2.5 text-center">
          <div>
            <p className="font-display text-sm font-bold text-foreground">{formatCompact(creator.total_followers, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{t("card.followers")}</p>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-foreground">{localizeDigits(Number(creator.avg_engagement).toFixed(1), lang)}%</p>
            <p className="text-[11px] text-muted-foreground">{t("card.engagement")}</p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <RatingStars value={Number(creator.rating_avg)} count={creator.rating_count} />
          {creator.starting_price > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t("card.from")} </span>
              <span className="font-bold text-primary">{formatBDT(creator.starting_price, lang)}</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
