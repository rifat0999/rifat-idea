import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "./language-toggle";

export function SiteHeader() {
  const { t } = useI18n();
  const { user, signOut, ready } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/influencers" as const, label: t("nav.find") },
    { to: "/about" as const, label: t("nav.about") },
    { to: "/help" as const, label: t("nav.help") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-lg">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/auth"
            search={{ mode: "signup", role: "creator" }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t("nav.creators")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <div className="hidden items-center gap-2 md:flex">
            {ready && user ? (
              <>
                <Button variant="soft" size="sm" asChild>
                  <Link to="/dashboard"><LayoutDashboard /> {t("nav.dashboard")}</Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("nav.signout")}>
                  <LogOut />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth" search={{ mode: "signin" }}>{t("nav.signin")}</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>{t("nav.getStarted")}</Link>
                </Button>
              </>
            )}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label={t("nav.menu")}>
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle><Logo /></SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1 px-4" onClick={() => setOpen(false)}>
                {links.map((l) => (
                  <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">
                    {l.label}
                  </Link>
                ))}
                <Link to="/auth" search={{ mode: "signup", role: "creator" }} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">
                  {t("nav.creators")}
                </Link>
                <div className="my-3 h-px bg-border" />
                {user ? (
                  <>
                    <Link to="/dashboard" className="rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent">
                      {t("nav.dashboard")}
                    </Link>
                    <button type="button" onClick={signOut} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-accent">
                      {t("nav.signout")}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" asChild>
                      <Link to="/auth" search={{ mode: "signin" }}>{t("nav.signin")}</Link>
                    </Button>
                    <Button variant="hero" asChild>
                      <Link to="/auth" search={{ mode: "signup" }}>{t("nav.getStarted")}</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
