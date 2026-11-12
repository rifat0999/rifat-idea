import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About BrandLinks | BrandLinks" },
      { name: "description", content: "BrandLinks connects Bangladeshi brands with influencers and content creators." },
      { property: "og:title", content: "About BrandLinks | BrandLinks" },
      { property: "og:description", content: "BrandLinks connects Bangladeshi brands with influencers and content creators." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="page-container max-w-3xl py-14">
      <h1 className="font-display text-3xl font-bold">About BrandLinks</h1>
      <div className="mt-6 flex flex-col gap-4 text-muted-foreground"><p>BrandLinks is Bangladesh's marketplace for influencer marketing. Brands discover verified creators on Facebook, Instagram, YouTube and TikTok, book clear packages priced in Taka, and track every campaign in one place.</p><p>Creators get a professional profile, fair bookings and payouts managed by our team.</p></div>
    </main>
  );
}
