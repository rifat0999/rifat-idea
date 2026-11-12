export type Lang = "en" | "bn";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toBnDigits(value: string): string {
  return value.replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function localizeDigits(value: string | number, lang: Lang): string {
  const s = String(value);
  return lang === "bn" ? toBnDigits(s) : s;
}

/** Bangladeshi Taka with South Asian digit grouping, e.g. ৳1,20,000 */
export function formatBDT(amount: number | null | undefined, lang: Lang = "en"): string {
  const n = Math.round(amount ?? 0);
  const s = new Intl.NumberFormat("en-IN").format(n);
  return "৳" + localizeDigits(s, lang);
}

/** Compact follower counts: 1.2M / 412K (en), ১২.৪ লাখ / ৪১২ হাজার (bn) */
export function formatCompact(n: number | null | undefined, lang: Lang = "en"): string {
  const v = n ?? 0;
  if (lang === "bn") {
    if (v >= 10_000_000) return toBnDigits(trim(v / 10_000_000)) + " কোটি";
    if (v >= 100_000) return toBnDigits(trim(v / 100_000)) + " লাখ";
    if (v >= 1000) return toBnDigits(trim(v / 1000)) + " হাজার";
    return toBnDigits(String(v));
  }
  if (v >= 1_000_000) return trim(v / 1_000_000) + "M";
  if (v >= 1000) return trim(v / 1000) + "K";
  return String(v);
}

function trim(x: number): string {
  return x >= 100 ? Math.round(x).toString() : x.toFixed(1).replace(/\.0$/, "");
}

export function formatDate(value: string | null | undefined, lang: Lang = "en"): string {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined, lang: Lang = "en"): string {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string | null | undefined): string {
  if (!name) return "BL";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

/** Commission split, mirrors the database trigger (rounded to whole taka). */
export function splitCommission(amount: number, ratePercent: number) {
  const commission = Math.round((amount * ratePercent) / 100);
  return { commission, payout: amount - commission };
}
