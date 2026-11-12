import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCreatorBySlug } from "@/lib/public.functions";

export const Route = createFileRoute("/influencers/$slug")({
  loader: async ({ params }) => {
    const data = await getCreatorBySlug({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.creator.display_name} | BrandLinks` : "Creator unavailable | BrandLinks" },
      { name: "description", content: loaderData?.creator.headline ?? "Influencer profile on BrandLinks." },
      { property: "og:title", content: loaderData?.creator.display_name ?? "BrandLinks creator" },
      { property: "og:description", content: loaderData?.creator.headline ?? "Influencer profile on BrandLinks." },
    ],
  }),
  component: CreatorPage,
});

function CreatorPage() {
  const { creator, packages } = Route.useLoaderData();
  return (
    <main className="page-container py-10">
      <h1 className="font-display text-3xl font-bold">{creator.display_name}</h1>
      <p className="mt-2 text-muted-foreground">{creator.headline}</p>
      <p className="mt-4 max-w-2xl">{creator.bio}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {packages.map((p) => (
          <li key={p.id} className="surface-card p-4">
            <p className="font-semibold">{p.title}</p>
            <p className="text-primary font-bold">৳{new Intl.NumberFormat("en-IN").format(p.price_bdt)}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
