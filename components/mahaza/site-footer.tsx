import Link from "next/link";
import { theme } from "@/theme.config";
import { sites } from "@/lib/sites";

const hhmm = (t: string) => t.replace(":", "h");

/** Pied de page premium (fond charcoal, texte crème, liens or). */
export function MahazaFooter() {
  return (
    <footer id="contact" className="bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <p className="font-heading text-3xl font-medium">{theme.name}</p>
            <p className="max-w-xs text-sm leading-relaxed text-background/80">{theme.description}</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Nos spas</h2>
            <ul className="mt-4 space-y-1.5 text-sm">
              {sites.map((s) => (
                <li key={s.id}>
                  {s.name} <span className="text-xs text-background/70">· {s.address}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Horaires</h2>
            <ul className="mt-4 space-y-1.5 text-sm">
              {theme.schedule?.map((r) => (
                <li key={r.label}>
                  {r.label} : {hhmm(r.open)} – {hhmm(r.close)}
                </li>
              ))}
            </ul>
            {theme.hoursToConfirm && <p className="mt-2 text-xs italic text-background/70">Horaires à confirmer par site.</p>}
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Contact</h2>
            {theme.contactEmail && (
              <p className="mt-4 text-sm">
                <a href={`mailto:${theme.contactEmail}`} className="text-accent underline underline-offset-4 hover:text-background">
                  {theme.contactEmail}
                </a>
              </p>
            )}
            {theme.socials && (
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm" aria-label="Réseaux sociaux">
                {theme.socials.map((s) => (
                  <li key={s.network}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:text-background">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-background/20 pt-6 text-xs text-background/75 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Démo : contenu issu du site actuel de Mahaza Beauty. Aucune réservation n&apos;est réellement enregistrée et aucun paiement n&apos;est effectué. Les données marquées FICTIF sont inventées.
          </p>
          <Link href="/admin" className="shrink-0 text-accent underline underline-offset-4 hover:text-background">
            Accès back-office (démo)
          </Link>
        </div>
      </div>
    </footer>
  );
}
