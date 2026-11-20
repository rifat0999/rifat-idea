import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VerificationStatus } from "@/lib/constants";

export function adminHead(title: string, description: string) {
  return { meta: [
    { title: `${title} | BrandLinks admin` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | BrandLinks admin` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] };
}

export function safeExternalUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch { return undefined; }
}

export type CreatorLite = {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  avatar_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  verification_status: VerificationStatus;
};
export type BusinessLite = {
  user_id: string;
  company_name: string;
  logo_url: string | null;
  verification_status: VerificationStatus;
};

export const adminKeys = {
  all: ["admin"] as const,
  directory: ["admin", "directory"] as const,
  users: ["admin", "users"] as const,
  verification: ["admin", "verification"] as const,
  campaigns: ["admin", "campaigns"] as const,
  bookings: ["admin", "bookings"] as const,
  payments: (bookingId: string) => ["admin", "payments", bookingId] as const,
  overview: ["admin", "overview"] as const,
  settings: ["admin", "settings"] as const,
};

/** Creator and brand names keyed by account id, for labelling admin lists. */
export function useAdminDirectory() {
  return useQuery({
    queryKey: adminKeys.directory,
    queryFn: async () => {
      const [creators, businesses] = await Promise.all([
        supabase
          .from("creator_profiles")
          .select("id, user_id, slug, display_name, avatar_url, is_published, is_featured, verification_status"),
        supabase.from("business_profiles").select("user_id, company_name, logo_url, verification_status"),
      ]);
      if (creators.error) throw creators.error;
      if (businesses.error) throw businesses.error;
      const creatorsByUser = new Map<string, CreatorLite>();
      for (const c of creators.data ?? []) creatorsByUser.set(c.user_id, c);
      const businessesByUser = new Map<string, BusinessLite>();
      for (const b of businesses.data ?? []) businessesByUser.set(b.user_id, b);
      return { creatorsByUser, businessesByUser };
    },
  });
}

export function errorText(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9"
      />
    </div>
  );
}

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="w-full sm:w-52" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
