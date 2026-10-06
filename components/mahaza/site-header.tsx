import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "./ui/button";

const NAV = [
  { href: "/#soins", label: "Nos soins" },
  { href: "/#cartes-cadeaux", label: "Cartes cadeaux" },
  { href: "/#spas", label: "Nos spas" },
  { href: "/#contact", label: "Contact" },
];

/** En-tête premium : lien d'évitement, logo, navigation d'ancres (≥ md), bouton de réservation. */
export function MahazaHeader() {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-[60] rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <BrandLogo />
          <nav aria-label="Navigation principale" className="hidden md:block">
            <ul className="flex items-center gap-8 text-sm">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="relative py-2 text-foreground/80 transition-colors hover:text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 motion-reduce:after:transition-none">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Button asChild size="sm">
            <Link href="/reserver">Réserver</Link>
          </Button>
        </div>
      </header>
    </>
  );
}
