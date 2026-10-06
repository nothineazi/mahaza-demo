import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Back-office" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <Badge variant="warning" className="whitespace-nowrap">
              Démo<span className="hidden sm:inline">&nbsp;· back-office</span>
            </Badge>
          </div>
          <Link href="/" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground">
            Voir le site <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </header>
      <AdminNav />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Démonstration sans authentification. Les modifications restent en mémoire dans votre navigateur et disparaissent au rechargement de la page.
        </p>
        {children}
      </main>
    </div>
  );
}
