import type { Practitioner, Reservation, Service } from "@/data/types";
import { formatDateLong } from "@/lib/dates";
import { whatsappLink } from "@/lib/whatsapp";
import { phoneDigits } from "./phone";

export interface ReminderContext {
  brand: string;
  siteName: string;
  services: Service[];
  staff: Practitioner[];
}

/** Message modèle J-1 (pré-rempli : l'envoi reste manuel dans WhatsApp). */
export function reminderMessage(r: Reservation, ctx: ReminderContext): string {
  const first = r.customerName.split(" ")[0];
  const soins = r.lines.map((l) => ctx.services.find((s) => s.id === l.serviceId)?.name ?? l.serviceId).join(", ");
  return [
    `Bonjour ${first}, c'est ${ctx.brand} (${ctx.siteName}).`,
    `Petit rappel : votre rendez-vous a lieu demain, ${formatDateLong(r.date)} à ${r.lines[0].start} (${soins}).`,
    `Référence : ${r.reference}.`,
    r.status === "pending_deposit" ? "Nous n'avons pas encore reçu votre acompte : merci de nous le confirmer pour garder votre créneau." : "",
    "Pour modifier ou annuler, répondez simplement à ce message. À demain !",
  ]
    .filter(Boolean)
    .join("\n");
}

/** wa.me vers le téléphone du client. */
export function reminderLink(r: Reservation, ctx: ReminderContext): string {
  return whatsappLink(phoneDigits(r.customerPhone), reminderMessage(r, ctx));
}
