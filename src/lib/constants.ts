import type { Database } from "@/integrations/supabase/types";

export type Platform = Database["public"]["Enums"]["social_platform"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type VerificationStatus = Database["public"]["Enums"]["verification_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];

type Bi = { en: string; bn: string };

export const PLATFORMS: { value: Platform; label: Bi }[] = [
  { value: "facebook", label: { en: "Facebook", bn: "ফেসবুক" } },
  { value: "instagram", label: { en: "Instagram", bn: "ইনস্টাগ্রাম" } },
  { value: "youtube", label: { en: "YouTube", bn: "ইউটিউব" } },
  { value: "tiktok", label: { en: "TikTok", bn: "টিকটক" } },
  { value: "linkedin", label: { en: "LinkedIn", bn: "লিংকডইন" } },
  { value: "x", label: { en: "X (Twitter)", bn: "এক্স (টুইটার)" } },
  { value: "other", label: { en: "Other", bn: "অন্যান্য" } },
];

export const NICHES: { value: string; label: Bi }[] = [
  { value: "fashion", label: { en: "Fashion", bn: "ফ্যাশন" } },
  { value: "beauty", label: { en: "Beauty", bn: "বিউটি" } },
  { value: "lifestyle", label: { en: "Lifestyle", bn: "লাইফস্টাইল" } },
  { value: "food", label: { en: "Food", bn: "খাবার" } },
  { value: "tech", label: { en: "Tech", bn: "প্রযুক্তি" } },
  { value: "gaming", label: { en: "Gaming", bn: "গেমিং" } },
  { value: "travel", label: { en: "Travel", bn: "ভ্রমণ" } },
  { value: "fitness", label: { en: "Fitness", bn: "ফিটনেস" } },
  { value: "health", label: { en: "Health", bn: "স্বাস্থ্য" } },
  { value: "parenting", label: { en: "Parenting", bn: "প্যারেন্টিং" } },
  { value: "comedy", label: { en: "Comedy", bn: "কমেডি" } },
  { value: "entertainment", label: { en: "Entertainment", bn: "বিনোদন" } },
  { value: "education", label: { en: "Education", bn: "শিক্ষা" } },
  { value: "finance", label: { en: "Finance", bn: "অর্থনীতি" } },
  { value: "automotive", label: { en: "Automotive", bn: "অটোমোবাইল" } },
];

export const LOCATIONS: { value: string; label: Bi }[] = [
  { value: "Dhaka", label: { en: "Dhaka", bn: "ঢাকা" } },
  { value: "Chattogram", label: { en: "Chattogram", bn: "চট্টগ্রাম" } },
  { value: "Sylhet", label: { en: "Sylhet", bn: "সিলেট" } },
  { value: "Rajshahi", label: { en: "Rajshahi", bn: "রাজশাহী" } },
  { value: "Khulna", label: { en: "Khulna", bn: "খুলনা" } },
  { value: "Barishal", label: { en: "Barishal", bn: "বরিশাল" } },
  { value: "Rangpur", label: { en: "Rangpur", bn: "রংপুর" } },
  { value: "Mymensingh", label: { en: "Mymensingh", bn: "ময়মনসিংহ" } },
];

export const FOLLOWER_RANGES: { value: number; label: Bi }[] = [
  { value: 10_000, label: { en: "10K+", bn: "১০ হাজার+" } },
  { value: 50_000, label: { en: "50K+", bn: "৫০ হাজার+" } },
  { value: 100_000, label: { en: "100K+", bn: "১ লাখ+" } },
  { value: 500_000, label: { en: "500K+", bn: "৫ লাখ+" } },
  { value: 1_000_000, label: { en: "1M+", bn: "১০ লাখ+" } },
];

export const BUDGET_RANGES: { value: number; label: Bi }[] = [
  { value: 15_000, label: { en: "Up to ৳15,000", bn: "৳১৫,০০০ পর্যন্ত" } },
  { value: 30_000, label: { en: "Up to ৳30,000", bn: "৳৩০,০০০ পর্যন্ত" } },
  { value: 50_000, label: { en: "Up to ৳50,000", bn: "৳৫০,০০০ পর্যন্ত" } },
  { value: 100_000, label: { en: "Up to ৳1,00,000", bn: "৳১,০০,০০০ পর্যন্ত" } },
];

export const BOOKING_STATUS: Record<BookingStatus, { label: Bi; tone: "muted" | "soft" | "success" | "warning" | "destructive" | "default" }> = {
  pending: { label: { en: "Awaiting response", bn: "উত্তরের অপেক্ষায়" }, tone: "warning" },
  accepted: { label: { en: "Accepted", bn: "গৃহীত" }, tone: "soft" },
  declined: { label: { en: "Declined", bn: "প্রত্যাখ্যাত" }, tone: "destructive" },
  cancelled: { label: { en: "Cancelled", bn: "বাতিল" }, tone: "muted" },
  in_progress: { label: { en: "In progress", bn: "চলমান" }, tone: "default" },
  delivered: { label: { en: "Delivered", bn: "ডেলিভারি হয়েছে" }, tone: "soft" },
  completed: { label: { en: "Completed", bn: "সম্পন্ন" }, tone: "success" },
  disputed: { label: { en: "In dispute", bn: "বিরোধ চলছে" }, tone: "destructive" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: Bi; tone: "muted" | "soft" | "success" | "warning" | "destructive" }> = {
  unpaid: { label: { en: "Unpaid", bn: "অপরিশোধিত" }, tone: "muted" },
  submitted: { label: { en: "Payment under review", bn: "পেমেন্ট যাচাই চলছে" }, tone: "warning" },
  verified: { label: { en: "Payment verified", bn: "পেমেন্ট যাচাইকৃত" }, tone: "success" },
  rejected: { label: { en: "Payment rejected", bn: "পেমেন্ট বাতিল" }, tone: "destructive" },
  released: { label: { en: "Payout released", bn: "পেআউট দেওয়া হয়েছে" }, tone: "success" },
  refunded: { label: { en: "Refunded", bn: "ফেরত দেওয়া হয়েছে" }, tone: "muted" },
};

export const VERIFICATION: Record<VerificationStatus, { label: Bi; tone: "muted" | "warning" | "success" | "destructive" }> = {
  unverified: { label: { en: "Not verified", bn: "যাচাই হয়নি" }, tone: "muted" },
  pending: { label: { en: "Verification pending", bn: "যাচাই অপেক্ষমাণ" }, tone: "warning" },
  verified: { label: { en: "Verified", bn: "যাচাইকৃত" }, tone: "success" },
  rejected: { label: { en: "Verification rejected", bn: "যাচাই বাতিল" }, tone: "destructive" },
};

export const PAYMENT_METHODS: { value: "bkash" | "nagad" | "rocket" | "bank_transfer"; label: Bi }[] = [
  { value: "bkash", label: { en: "bKash", bn: "বিকাশ" } },
  { value: "nagad", label: { en: "Nagad", bn: "নগদ" } },
  { value: "rocket", label: { en: "Rocket", bn: "রকেট" } },
  { value: "bank_transfer", label: { en: "Bank transfer", bn: "ব্যাংক ট্রান্সফার" } },
];

export function labelOf<T extends string>(
  list: { value: T | string | number; label: Bi }[],
  value: T | string | number | null | undefined,
  lang: "en" | "bn",
): string {
  const item = list.find((i) => i.value === value);
  return item ? item.label[lang] : String(value ?? "");
}
