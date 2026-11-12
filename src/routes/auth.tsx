import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/brand/logo";
import { GoogleButton } from "@/components/brand/google-button";
import { RolePicker, type SignupRole } from "@/components/brand/role-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthSearch = { mode?: "signin" | "signup" | "forgot" | undefined; role?: SignupRole | undefined; redirect?: string | undefined };

function safeRedirect(r?: string | null): string {
  return r && r.startsWith("/") && !r.startsWith("//") ? r : "/dashboard";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    mode: s["mode"] === "signup" || s["mode"] === "forgot" || s["mode"] === "signin" ? s["mode"] : undefined,
    role: s["role"] === "creator" || s["role"] === "business" ? s["role"] : undefined,
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or join | BrandLinks" },
      { name: "description", content: "Sign in to BrandLinks or create a brand or creator account." },
      { property: "og:title", content: "Sign in or join | BrandLinks" },
      { property: "og:description", content: "Create a brand or creator account on BrandLinks." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

function AuthPage() {
  const search = Route.useSearch();
  const { t } = useI18n();
  const { user, ready } = useAuth();
  const router = useRouter();
  const mode = search.mode ?? "signin";
  const [role, setRole] = useState<SignupRole>(search.role ?? "business");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    const stored = sessionStorage.getItem("bl-redirect");
    sessionStorage.removeItem("bl-redirect");
    router.history.replace(safeRedirect(search.redirect ?? stored));
  }, [ready, user, router, search.redirect]);

  useEffect(() => setNotice(null), [mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ name, email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.path[0] === "password" ? "Password must be at least 8 characters." : "Please check your name and email.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { role, full_name: parsed.data.name } },
        });
        if (error) throw error;
        if (!data.session) setNotice(t("auth.checkEmail"));
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice(t("auth.resetSent"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    sessionStorage.setItem("bl-redirect", safeRedirect(search.redirect));
    if (mode === "signup") sessionStorage.setItem("bl-role", role);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(result.error.message);
  }

  return (
    <main className="relative overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(60%_60%_at_50%_20%,black,transparent)]" />
      <div className="page-container relative flex justify-center py-12 sm:py-20">
        <div className="surface-card w-full max-w-md p-6 shadow-elegant sm:p-8">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="mt-6 text-center font-display text-2xl font-bold">
            {mode === "signup" ? t("auth.create") : mode === "forgot" ? t("auth.forgot") : t("auth.welcome")}
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">{t("brand.tagline")}</p>

          {notice ? (
            <div className="mt-6 rounded-xl bg-accent p-4 text-sm text-accent-foreground">{notice}</div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
              {mode === "signup" && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label>{t("auth.iam")}</Label>
                    <RolePicker value={role} onChange={setRole} />
                  </div>
                  <Field label={role === "business" ? t("auth.companyName") : t("auth.creatorName")}>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" />
                  </Field>
                </>
              )}
              <Field label={t("auth.email")}>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} autoComplete="email" />
              </Field>
              {mode !== "forgot" && (
                <Field
                  label={t("auth.password")}
                  extra={mode === "signin" ? <Link to="/auth" search={{ ...search, mode: "forgot" }} className="text-xs font-medium text-primary">{t("auth.forgot")}</Link> : undefined}
                >
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "signup" ? 8 : 1} maxLength={72} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                </Field>
              )}
              <Button type="submit" variant="hero" size="lg" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {mode === "signup" ? t("auth.signup") : mode === "forgot" ? t("common.submit") : t("auth.signin")}
              </Button>
              {mode !== "forgot" && (
                <>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("auth.or")}<span className="h-px flex-1 bg-border" /></div>
                  <GoogleButton label={t("auth.google")} onClick={google} disabled={busy} />
                </>
              )}
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
            <Link to="/auth" search={{ ...search, mode: mode === "signup" ? "signin" : "signup" }} className="font-semibold text-primary">
              {mode === "signup" ? t("auth.signin") : t("auth.signup")}
            </Link>
          </p>
          {mode === "signup" && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              <Link to="/terms" className="underline">{t("auth.terms")}</Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, children, extra }: { label: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between"><Label>{label}</Label>{extra}</div>
      {children}
    </div>
  );
}
