import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy | BrandLinks" },
      { name: "description", content: "How BrandLinks collects, uses and protects your information." },
      { property: "og:title", content: "Privacy policy | BrandLinks" },
      { property: "og:description", content: "How BrandLinks collects, uses and protects your information." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="page-container max-w-3xl py-14">
      <h1 className="font-display text-3xl font-bold">Privacy policy</h1>
      <div className="mt-6 flex flex-col gap-4 text-muted-foreground"><p>We collect the information you give us to run your account and bookings. Your email address and phone number are never shown publicly.</p><p>Public creator profiles show only what creators choose to publish. Payment references are visible only to the paying brand and BrandLinks admins.</p><p>This policy is a draft for the MVP and should be reviewed before launch.</p></div>
    </main>
  );
}
