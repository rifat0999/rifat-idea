import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | BrandLinks" },
      { name: "description", content: "Sign in or create your BrandLinks account." },
      { property: "og:title", content: "Sign in | BrandLinks" },
      { property: "og:description", content: "Sign in or create your BrandLinks account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMsg(error ? error.message : "Signed in.");
  }
  async function signUp(role: "business" | "creator") {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { role, full_name: email.split("@")[0] } },
    });
    setMsg(error ? error.message : "Check your email to confirm your account.");
  }
  return (
    <main className="page-container flex max-w-md flex-col gap-3 py-16">
      <h1 className="font-display text-2xl font-bold">BrandLinks</h1>
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button onClick={signIn}>Sign in</Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => signUp("business")}>Sign up as brand</Button>
        <Button variant="outline" onClick={() => signUp("creator")}>Sign up as creator</Button>
      </div>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </main>
  );
}
