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
