import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex size-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow", className)}>
      <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-primary-foreground" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
        <path d="M9.5 14.5 14.5 9.5" />
        <path d="M11 6.5 12.6 4.9a3.9 3.9 0 0 1 5.5 5.5L16.5 12" />
        <path d="M13 17.5 11.4 19.1a3.9 3.9 0 0 1-5.5-5.5L7.5 12" />
      </svg>
    </span>
  );
}

export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2.5", className)} aria-label="BrandLinks home">
      <LogoMark />
      <span className={cn("font-display text-xl font-extrabold tracking-tight", onDark ? "text-navy-foreground" : "text-foreground")}>
        Brand<span className={onDark ? "text-primary-glow" : "text-primary"}>Links</span>
      </span>
    </Link>
  );
}
