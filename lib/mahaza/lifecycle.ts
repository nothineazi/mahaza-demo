import type { BookingStatus, Reservation } from "@/data/types";
import { STATUS_LABELS, occupiesSlot } from "./status";

/** Transitions autorisées du cycle de vie d'une réservation (corrections incluses). */
export const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending_deposit: ["confirmed", "cancelled"],
  confirmed: ["completed", "no_show", "cancelled", "pending_deposit"],
  completed: ["confirmed"],
  no_show: ["confirmed"],
  cancelled: ["pending_deposit", "confirmed"],
};

export type TransitionCheck = { ok: true } | { ok: false; reason: string };

/** Vérifie une transition (sans les conflits de créneau, traités par `conflicts.ts`). */
export function checkTransition(r: Pick<Reservation, "status" | "date">, to: BookingStatus, today: string): TransitionCheck {
  if (r.status === to) return { ok: false, reason: "Statut déjà appliqué." };
  if (!TRANSITIONS[r.status].includes(to)) {
    return { ok: false, reason: `Passage de « ${STATUS_LABELS[r.status]} » à « ${STATUS_LABELS[to]} » impossible.` };
  }
  if ((to === "completed" || to === "no_show") && r.date > today) {
    return { ok: false, reason: "Disponible à partir du jour du rendez-vous." };
  }
  return { ok: true };
}

/** Une réouverture (annulée → active) doit vérifier que le créneau est encore libre. */
export const reoccupiesSlot = (from: BookingStatus, to: BookingStatus): boolean => !occupiesSlot(from) && occupiesSlot(to);
