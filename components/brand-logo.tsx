import Link from "next/link";
import { theme } from "@/theme.config";
import { cn } from "@/lib/utils";

/** Logo placeholder (texte) : à remplacer par l'image de la marque. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex flex-col leading-none", className)} aria-label={`${theme.name} — accueil`}>
      <span className="font-heading text-xl font-bold tracking-wide text-primary">{theme.logoText}</span>
      <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{theme.tagline}</span>
    </Link>
  );
}
