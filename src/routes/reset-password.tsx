import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password | BrandLinks" },
      { name: "description", content: "Set a new password for your BrandLinks account." },
      { property: "og:title", content: "Reset password | BrandLinks" },
      { property: "og:description", content: "Set a new password for your BrandLinks account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.passwordUpdated"));
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="page-container flex justify-center py-16">
      <form onSubmit={submit} className="surface-card flex w-full max-w-md flex-col gap-4 p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold">{t("auth.updatePassword")}</h1>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pw">{t("auth.newPassword")}</Label>
          <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={72} required autoComplete="new-password" />
        </div>
        <Button type="submit" variant="hero" disabled={busy}>{t("auth.updatePassword")}</Button>
      </form>
    </main>
  );
}
