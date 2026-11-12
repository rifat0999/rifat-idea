import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { useI18n } from "@/lib/i18n";
import { localizeDigits } from "@/lib/format";

export function SiteFooter() {
  const { t, lang } = useI18n();
  return (
    <footer className="mt-20 bg-gradient-navy text-navy-foreground">
      <div className="page-container grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo onDark />
          <p className="mt-3 text-sm font-semibold text-primary-glow">{t("brand.tagline")}</p>
          <p className="mt-3 text-sm text-navy-foreground/70">{t("footer.desc")}</p>
        </div>
        <FooterCol title={t("footer.platform")}>
          <Link to="/influencers">{t("nav.find")}</Link>
          <Link to="/auth" search={{ mode: "signup", role: "business" }}>{t("home.cta.brand")}</Link>
          <Link to="/auth" search={{ mode: "signup", role: "creator" }}>{t("home.cta.btn")}</Link>
        </FooterCol>
        <FooterCol title={t("footer.company")}>
          <Link to="/about">{t("nav.about")}</Link>
          <Link to="/help">{t("nav.help")}</Link>
        </FooterCol>
        <FooterCol title={t("footer.legal")}>
          <Link to="/terms">{t("footer.terms")}</Link>
          <Link to="/privacy">{t("footer.privacy")}</Link>
        </FooterCol>
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="page-container flex flex-col gap-2 py-5 text-xs text-navy-foreground/60 sm:flex-row sm:justify-between">
          <p>© {localizeDigits(new Date().getFullYear(), lang)} BrandLinks. {t("footer.rights")}</p>
          <p>{t("footer.made")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 flex flex-col gap-2 text-sm text-navy-foreground/70 [&_a:hover]:text-navy-foreground">{children}</div>
    </div>
  );
}
