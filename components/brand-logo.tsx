import Image from "next/image";
import Link from "next/link";
import { theme } from "@/theme.config";
import { cn } from "@/lib/utils";

/** Logo de la marque : image locale à sa taille native si elle existe, sinon repli texte. */
export function BrandLogo({ className }: { className?: string }) {
  const logo = theme.logo;
  return (
    <Link href="/" className={cn("flex flex-col leading-none", className)} aria-label={`${theme.name} — accueil`}>
      {logo ? (
        // Logo 151×51 : affiché à sa taille native (jamais agrandi).
        <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} priority className="h-auto w-auto max-w-[151px]" />
      ) : (
        <>
          <span className="font-heading text-xl font-bold tracking-wide text-primary">{theme.logoText}</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{theme.tagline}</span>
        </>
      )}
    </Link>
  );
}
