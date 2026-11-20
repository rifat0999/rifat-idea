import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { BadgeCheck, LayoutGrid, Megaphone, Receipt, ShieldCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) throw redirect({ to: "/auth", search: { mode: "signin" } });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Admin | BrandLinks" },
      { name: "description", content: "Manage BrandLinks users, verification, campaigns and bookings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { t } = useI18n();
  const tabs = [
    { to: "/admin" as const, label: t("adm.overview"), icon: LayoutGrid, exact: true },
    { to: "/admin/users" as const, label: t("adm.allUsers"), icon: Users, exact: false },
    { to: "/admin/verification" as const, label: t("adm.verification"), icon: BadgeCheck, exact: false },
    { to: "/admin/campaigns" as const, label: t("adm.campaigns"), icon: Megaphone, exact: false },
    { to: "/admin/bookings" as const, label: t("adm.bookings"), icon: Receipt, exact: false },
  ];
  return (
    <main className="page-container py-8 sm:py-10">
      <div className="mb-6 flex items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("adm.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("adm.sub")}</p>
        </div>
      </div>
      <nav
        aria-label={t("adm.title")}
        className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: tab.exact }}
            className="-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-primary data-[status=active]:text-primary"
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </main>
  );
}
