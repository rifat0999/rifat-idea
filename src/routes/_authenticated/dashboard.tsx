import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | BrandLinks" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const { user, roles, signOut } = useAuth();
  return (
    <main className="page-container py-12">
      <div className="surface-card max-w-xl p-6">
        <h1 className="font-display text-2xl font-bold">{t("dash.hello")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>
        <p className="mt-1 text-sm text-muted-foreground">{roles.join(", ") || "—"}</p>
        <div className="mt-6 flex gap-2">
          <Button variant="hero" asChild><Link to="/influencers">{t("nav.find")}</Link></Button>
          <Button variant="outline" onClick={signOut}>{t("nav.signout")}</Button>
        </div>
      </div>
    </main>
  );
}
