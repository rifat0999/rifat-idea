import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help centre | BrandLinks" },
      { name: "description", content: "Answers to common questions about booking, payments and verification on BrandLinks." },
      { property: "og:title", content: "Help centre | BrandLinks" },
      { property: "og:description", content: "Answers to common questions about booking, payments and verification on BrandLinks." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="page-container max-w-3xl py-14">
      <h1 className="font-display text-3xl font-bold">Help centre</h1>
      <div className="mt-6 flex flex-col gap-4 text-muted-foreground"><p><strong>How do payments work?</strong> After a creator accepts, the brand pays BrandLinks by bKash, Nagad, Rocket or bank transfer and submits the transaction ID. Our team verifies it, and the creator's payout is released after the brand approves delivery.</p><p><strong>How do I get verified?</strong> Creators and brands can request verification from their profile. Our team reviews every request.</p><p><strong>What does BrandLinks charge?</strong> A platform commission is deducted from each booking; the current rate is shown before you book.</p></div>
    </main>
  );
}
