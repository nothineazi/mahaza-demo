"use client";

import { useState } from "react";
import { ChevronUp, Info, Trash2 } from "lucide-react";
import { theme } from "@/theme.config";
import type { ReservationLine } from "@/data/types";
import { cartDurationLabel } from "@/lib/mahaza/cart";
import { endTime, formatDateLong } from "@/lib/dates";
import { getSite, multiSite } from "@/lib/sites";
import { depositForService } from "@/lib/availability";
import { formatPrice } from "@/lib/utils";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Card } from "../ui/card";
import type { Draft } from "./types";

export interface PrimaryAction {
  label: string;
  disabled?: boolean;
  /** Bouton « submit » d'un formulaire (id) plutôt qu'un clic. */
  form?: string;
  onClick?: () => void;
  hint?: string;
}

interface Props {
  draft: Draft;
  lines: ReservationLine[] | null;
  onRemove?: (serviceId: string) => void;
}


/** Contenu du récapitulatif : spa, soins du panier, créneau, acompte. Aucun prix de soin (inconnus). */
export function SummaryBody({ draft, lines, onRemove }: Props) {
  const site = draft.siteId ? getSite(draft.siteId) : null;
  const services = draft.cart.map((id) => theme.services.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  const total = cartDurationLabel(services);
  const deposit = site ? depositForService({}, site) : null;

  return (
    <div className="space-y-5 text-sm">
      {multiSite && site && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Spa</p>
          <p className="mt-1 font-medium">{site.name}</p>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vos soins</p>
        {services.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border p-4 text-muted-foreground">Votre panier est vide. Ajoutez un ou plusieurs soins.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {services.map((s, i) => {
              const line = lines?.[i];
              const practitioner = draft.choice[s.id];
              return (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="font-medium leading-snug">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {line ? `${line.start} – ${endTime(line.start, line.durationMin)}${s.durationMin == null ? " (indicatif)" : ""}` : practitioner ? "Praticien choisi" : "Sans préférence de praticien"}
                    </p>
                  </div>
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(s.id)}
                      className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="size-4" aria-hidden />
                      <span className="sr-only">Retirer {s.name}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {total && <p className="mt-2 font-medium">Durée totale : {total}</p>}
        {services.length > 0 && !total && (
          <p className="mt-2 flex gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Durées des soins à confirmer par {theme.name} : créneaux indicatifs de {theme.defaultDurationMin} min par soin (FICTIF).
          </p>
        )}
      </div>

      {draft.date && draft.time && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Créneau</p>
          <p className="mt-1 font-medium first-letter:uppercase">{formatDateLong(draft.date)}</p>
          <p className="text-muted-foreground">
            Début à {draft.time}
            {lines && lines.length > 0 && ` · fin vers ${endTime(lines[lines.length - 1].start, lines[lines.length - 1].durationMin)}`}
          </p>
        </div>
      )}

      {deposit != null && services.length > 0 && (
        <div className="flex items-baseline justify-between rounded-xl bg-secondary px-4 py-3 text-secondary-foreground">
          <span>Acompte (FICTIF)</span>
          <span className="font-heading text-xl font-medium">{formatPrice(deposit)}</span>
        </div>
      )}
    </div>
  );
}

/** Colonne latérale (≥ lg) : récapitulatif persistant + action principale. */
export function SummaryPanel({ draft, lines, action, onRemove }: Props & { action: PrimaryAction | null }) {
  return (
    <aside aria-label="Récapitulatif de votre réservation" className="hidden lg:block">
      <Card className="sticky top-24 space-y-6 p-6">
        <h2 className="font-heading text-2xl font-medium">Votre réservation</h2>
        <SummaryBody draft={draft} lines={lines} onRemove={onRemove} />
        {action && <ActionButton action={action} />}
      </Card>
    </aside>
  );
}

function ActionButton({ action, className }: { action: PrimaryAction; className?: string }) {
  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className={className ?? "w-full"}
        disabled={action.disabled}
        {...(action.form ? { type: "submit" as const, form: action.form } : { onClick: action.onClick })}
      >
        {action.label}
      </Button>
      {action.hint && action.disabled && <p className="text-center text-xs text-muted-foreground">{action.hint}</p>}
    </div>
  );
}

/** Barre fixe (< lg) : résumé compact, feuille du panier détaillé et action principale. */
export function SummaryBar({ draft, lines, action, onRemove }: Props & { action: PrimaryAction | null }) {
  const [open, setOpen] = useState(false);
  const count = draft.cart.length;
  const site = draft.siteId ? getSite(draft.siteId) : null;
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-lift backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {count === 0 ? "Panier vide" : `${count} soin${count > 1 ? "s" : ""}`}
                {multiSite && site ? ` · ${site.name}` : ""}
              </span>
              <span className="block text-xs text-muted-foreground">Voir le récapitulatif</span>
            </span>
            <ChevronUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
          {action && (
            <Button
              size="md"
              className="shrink-0"
              disabled={action.disabled}
              {...(action.form ? { type: "submit" as const, form: action.form } : { onClick: action.onClick })}
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent variant="sheet">
          <DialogHeader>
            <DialogTitle>Votre réservation</DialogTitle>
            <DialogDescription>Récapitulatif de vos choix.</DialogDescription>
          </DialogHeader>
          <SummaryBody draft={draft} lines={lines} onRemove={onRemove} />
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
