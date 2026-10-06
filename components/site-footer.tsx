import Link from "next/link";
import { theme } from "@/theme.config";
import { multiSite, sites } from "@/lib/sites";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground">
        <p className="font-heading text-base font-semibold text-foreground">{theme.name}</p>
        {multiSite ? (
          <div className="grid gap-6 pt-2 sm:grid-cols-3">
            <div>
              <p className="font-medium text-foreground">Nos spas</p>
              <ul className="mt-1 space-y-0.5">
                {sites.map((s) => (
                  <li key={s.id}>
                    {s.name} · <span className="text-xs">{s.address}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Horaires</p>
              <ul className="mt-1 space-y-0.5">
                {theme.schedule?.map((r) => (
                  <li key={r.label}>
                    {r.label} : {r.open.replace(":", "h")} – {r.close.replace(":", "h")}
                  </li>
                ))}
              </ul>
              {theme.hoursToConfirm && <p className="mt-1 text-xs italic">Horaires à confirmer par site.</p>}
            </div>
            <div>
              <p className="font-medium text-foreground">Contact</p>
              {theme.contactEmail && (
                <p className="mt-1">
                  <a href={`mailto:${theme.contactEmail}`} className="underline underline-offset-2 hover:text-foreground">
                    {theme.contactEmail}
                  </a>
                </p>
              )}
              {theme.socials && (
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5" aria-label="Réseaux sociaux">
                  {theme.socials.map((s) => (
                    <li key={s.network}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <>
            <p>{theme.address}</p>
            <p>{theme.hoursLabel}</p>
          </>
        )}
        {theme.id === "mahaza" && <p className="mt-2 text-xs font-medium text-foreground">Démo : contenu issu du site actuel de Mahaza Beauty</p>}
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
