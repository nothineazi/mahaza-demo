"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Reservation } from "@/data/types";
import { useMahazaStore } from "@/lib/mahaza/store";
import { planLines } from "@/lib/mahaza/scheduling";
import { timeToMin } from "@/lib/dates";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { StepSlot } from "./step-slot";
import { emptyDraft, wantedFromDraft, type Draft } from "./types";

/** Modification simulée : nouveau jour / heure pour les mêmes soins (état local, aucun envoi). */
export function ModifyDialog({ reservation, open, onOpenChange, onDone }: { reservation: Reservation; open: boolean; onOpenChange: (o: boolean) => void; onDone: (message: string) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="sheet" className="sm:max-w-2xl">
        <ModifyForm reservation={reservation} onClose={() => onOpenChange(false)} onDone={onDone} />
      </DialogContent>
    </Dialog>
  );
}

function ModifyForm({ reservation, onClose, onDone }: { reservation: Reservation; onClose: () => void; onDone: (message: string) => void }) {
  const store = useMahazaStore();
  const [draft, setDraft] = useState<Draft>(() => ({
    ...emptyDraft(reservation.siteId),
    cart: reservation.lines.map((l) => l.serviceId),
    choice: Object.fromEntries(reservation.lines.map((l) => [l.serviceId, l.noPreference ? null : l.practitionerId])),
    date: reservation.date,
    time: null,
  }));
  const [error, setError] = useState<string | null>(null);
  const ctx = useMemo(() => store.planContext(reservation.siteId), [store, reservation.siteId]);
  const wanted = useMemo(() => wantedFromDraft(draft), [draft]);
  const plan = useMemo(() => (draft.date && draft.time ? planLines(ctx, draft.date, timeToMin(draft.time), wanted, reservation.id) : null), [ctx, draft.date, draft.time, wanted, reservation.id]);

  const submit = () => {
    if (!draft.date || !draft.time) return;
    const res = store.rescheduleReservation(reservation.id, draft.date, timeToMin(draft.time));
    if (!res.ok) return setError(res.reason);
    onDone("Votre rendez-vous a été modifié (simulation : rien n'est envoyé au spa).");
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Modifier mon rendez-vous</DialogTitle>
        <DialogDescription>Choisissez un nouveau jour et une nouvelle heure pour les mêmes soins. Simulation : l&apos;état reste dans votre navigateur.</DialogDescription>
      </DialogHeader>
      <StepSlot draft={draft} ctx={ctx} lines={plan?.ok ? plan.lines : null} ignoreId={reservation.id} onChange={(p) => { setError(null); setDraft((d) => ({ ...d, ...p })); }} />
      {error && (
        <p role="alert" className="flex gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
        </p>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler la modification</Button>
        <Button disabled={!plan?.ok} onClick={submit}>Enregistrer le nouveau créneau</Button>
      </DialogFooter>
    </>
  );
}

/** Annulation simulée avec confirmation explicite. */
export function CancelDialog({ reservation, open, onOpenChange, onDone }: { reservation: Reservation; open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const { setStatus } = useMahazaStore();
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler ce rendez-vous ?</DialogTitle>
          <DialogDescription>
            La réservation {reservation.reference} sera annulée et le créneau libéré. Simulation : aucun message n&apos;est envoyé et aucun remboursement n&apos;est traité dans cette démo.
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Conserver mon rendez-vous</Button>
          <Button
            variant="danger"
            onClick={() => {
              const res = setStatus(reservation.id, "cancelled");
              if (!res.ok) return setError(res.reason);
              onOpenChange(false);
              onDone();
            }}
          >
            Oui, annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
