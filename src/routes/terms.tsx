import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service | BrandLinks" },
      { name: "description", content: "The terms for using the BrandLinks marketplace." },
      { property: "og:title", content: "Terms of service | BrandLinks" },
      { property: "og:description", content: "The terms for using the BrandLinks marketplace." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="page-container max-w-3xl py-14">
      <h1 className="font-display text-3xl font-bold">Terms of service</h1>
      <div className="mt-6 flex flex-col gap-4 text-muted-foreground"><p>By using BrandLinks you agree to provide accurate information, keep payments for bookings made here on the platform, and respect the intellectual property of creators and brands.</p><p>BrandLinks may suspend accounts that commit fraud, harassment or payment abuse. Disputes are reviewed by our admin team.</p><p>These terms are a draft for the MVP and should be reviewed by a lawyer before launch.</p></div>
    </main>
  );
}
