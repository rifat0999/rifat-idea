import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const CARD_FIELDS =
  "id, slug, display_name, headline, headline_bn, avatar_url, location, niches, total_followers, avg_engagement, starting_price, rating_avg, rating_count, verification_status, is_featured, creator_socials(platform, followers)";

export const platformEnum = z.enum(["facebook", "instagram", "youtube", "tiktok", "linkedin", "x", "other"]);

export const directorySearchSchema = z.object({
  q: z.string().max(80).optional(),
  platform: platformEnum.optional(),
  niche: z.string().max(40).optional(),
  location: z.string().max(40).optional(),
  minFollowers: z.coerce.number().int().min(0).max(100_000_000).optional(),
  maxBudget: z.coerce.number().int().min(0).max(100_000_000).optional(),
  verified: z.coerce.boolean().optional(),
  sort: z.enum(["popular", "rating", "price_low", "price_high"]).optional(),
});
export type DirectorySearch = z.infer<typeof directorySearchSchema>;

export const listCreators = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => directorySearchSchema.parse(d ?? {}))
  .handler(async ({ data }) => {
    const sb = publicClient();
    let ids: string[] | null = null;
    if (data.platform) {
      const { data: rows, error } = await sb.from("creator_socials").select("creator_id").eq("platform", data.platform);
      if (error) throw new Error(error.message);
      ids = Array.from(new Set((rows ?? []).map((r) => r.creator_id)));
      if (ids.length === 0) return [];
    }
    let query = sb.from("creator_profiles").select(CARD_FIELDS).eq("is_published", true);
    if (ids) query = query.in("id", ids);
    if (data.q) {
      const q = data.q.replace(/[,()%*\\]/g, " ").trim();
      if (q) query = query.or(`display_name.ilike.%${q}%,headline.ilike.%${q}%,headline_bn.ilike.%${q}%`);
    }
    if (data.niche) query = query.contains("niches", [data.niche]);
    if (data.location) query = query.eq("location", data.location);
    if (data.minFollowers) query = query.gte("total_followers", data.minFollowers);
    if (data.maxBudget) query = query.lte("starting_price", data.maxBudget).gt("starting_price", 0);
    if (data.verified) query = query.eq("verification_status", "verified");
    switch (data.sort) {
      case "rating":
        query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
        break;
      case "price_low":
        query = query.order("starting_price", { ascending: true });
        break;
      case "price_high":
        query = query.order("starting_price", { ascending: false });
        break;
      default:
        query = query.order("total_followers", { ascending: false });
    }
    const { data: rows, error } = await query.limit(60);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export type CreatorCardData = Awaited<ReturnType<typeof listCreators>>[number];

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [featured, stats] = await Promise.all([
    sb.from("creator_profiles").select(CARD_FIELDS).eq("is_published", true).eq("is_featured", true)
      .order("total_followers", { ascending: false }).limit(8),
    sb.from("creator_profiles").select("total_followers, verification_status, location").eq("is_published", true),
  ]);
  if (featured.error) throw new Error(featured.error.message);
  const all = stats.data ?? [];
  return {
    featured: featured.data ?? [],
    verifiedCount: all.filter((c) => c.verification_status === "verified").length,
    totalReach: all.reduce((s, c) => s + (c.total_followers ?? 0), 0),
    divisions: new Set(all.map((c) => c.location)).size,
  };
});

export const getCreatorBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: creator, error } = await sb
      .from("creator_profiles")
      .select(
        "id, user_id, slug, display_name, headline, headline_bn, bio, bio_bn, avatar_url, cover_url, location, niches, languages, audience, total_followers, avg_engagement, starting_price, rating_avg, rating_count, verification_status, is_featured, created_at",
      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!creator) return null;
    const [socials, packages, reviews] = await Promise.all([
      sb.from("creator_socials").select("id, platform, handle, url, followers, avg_views, engagement_rate")
        .eq("creator_id", creator.id).order("followers", { ascending: false }),
      sb.from("packages").select("id, title, title_bn, description, platform, deliverables, price_bdt, delivery_days")
        .eq("creator_id", creator.id).eq("is_active", true).order("price_bdt"),
      sb.from("reviews").select("id, rating, comment, created_at, business_id")
        .eq("creator_id", creator.id).order("created_at", { ascending: false }).limit(20),
    ]);
    const businessIds = Array.from(new Set((reviews.data ?? []).map((r) => r.business_id)));
    const businesses = businessIds.length
      ? (await sb.from("business_profiles").select("user_id, company_name, logo_url").in("user_id", businessIds)).data ?? []
      : [];
    return {
      creator,
      socials: socials.data ?? [],
      packages: packages.data ?? [],
      reviews: (reviews.data ?? []).map((r) => {
        const b = businesses.find((x) => x.user_id === r.business_id);
        return { id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at, company: b?.company_name ?? "Brand", logo: b?.logo_url ?? null };
      }),
    };
  });

export type CreatorDetail = NonNullable<Awaited<ReturnType<typeof getCreatorBySlug>>>;
