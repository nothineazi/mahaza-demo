import Link from "next/link";
import { theme } from "@/theme.config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground">
        <p className="font-heading text-base font-semibold text-foreground">{theme.name}</p>
        <p>{theme.address}</p>
        <p>{theme.hoursLabel}</p>
        <p className="mt-2 text-xs">
          Site de démonstration : aucune réservation n&apos;est réellement enregistrée et aucun paiement n&apos;est effectué.{" "}
          <Link href="/admin" className="underline underline-offset-2 hover:text-foreground">
            Accès back-office (démo)
          </Link>
        </p>
      </div>
    </footer>
  );
}
