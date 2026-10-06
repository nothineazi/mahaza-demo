import type { BookingStatus } from "@/data/types";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending_deposit: "En attente d'acompte",
  confirmed: "Confirmée",
  completed: "Terminée",
  cancelled: "Annulée",
  no_show: "No-show",
};

export const STATUS_ORDER: BookingStatus[] = ["pending_deposit", "confirmed", "completed", "cancelled", "no_show"];

/** Statuts qui occupent le créneau d'un praticien et d'une salle (les annulées et les no-show le libèrent). */
export const occupiesSlot = (status: BookingStatus): boolean =>
  status === "pending_deposit" || status === "confirmed" || status === "completed";

/** L'acompte est considéré reçu dès que la réservation a été confirmée. */
export const isDepositReceived = (status: BookingStatus): boolean =>
  status === "confirmed" || status === "completed" || status === "no_show";

/** Libellé de l'action qui fait passer une réservation d'un statut à un autre (back-office). */
export function transitionLabel(from: BookingStatus, to: BookingStatus): string {
  switch (to) {
    case "confirmed":
      return from === "pending_deposit" ? "Acompte reçu : confirmer" : from === "cancelled" ? "Rouvrir (confirmée)" : "Rétablir en confirmée";
    case "pending_deposit":
      return from === "cancelled" ? "Rouvrir (en attente d'acompte)" : "Remettre en attente d'acompte";
    case "completed":
      return "Marquer terminée";
    case "no_show":
      return "Marquer no-show";
    case "cancelled":
      return "Annuler la réservation";
  }
}
