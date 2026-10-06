import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Pill } from "../ui/pill";
import { AdminNav } from "./nav";
import { AdminSiteSelector } from "./site-selector";

/** Coque du back-office premium : en-tête, navigation, sélecteur de spa, bandeau « démo ». */
export function MahazaAdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-muted/40">
      <a href="#contenu-admin" className="sr-only z-[60] rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Aller au contenu
      </a>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <Pill tone="gold">
              Démo<span className="hidden sm:inline">&nbsp;· back-office</span>
            </Pill>
          </div>
          <Link href="/" className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground">
            Voir le site <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
      </header>
      <AdminNav />
      <main id="contenu-admin" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-6 outline-none">
        <AdminSiteSelector />
        <p className="mb-6 rounded-xl bg-card px-4 py-2.5 text-xs text-muted-foreground shadow-soft">
          Démonstration sans authentification. Les modifications restent en mémoire dans votre navigateur et disparaissent au rechargement. Données de démonstration marquées <strong className="text-foreground">FICTIF</strong>.
        </p>
        {children}
      </main>
    </div>
  );
}
