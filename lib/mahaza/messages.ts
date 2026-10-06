import type { Practitioner, Reservation, Room, Service } from "@/data/types";
import { endTime, formatDateLong } from "@/lib/dates";
import { formatPrice } from "@/lib/utils";
import { reservationEnd } from "./scheduling";

export interface ConfirmationContext {
  brand: string;
  siteName: string | null;
  momoNumber: string;
  services: Service[];
  staff: Practitioner[];
  rooms: Room[];
}

/** Message WhatsApp pré-rempli envoyé au spa après la réservation (le client l'envoie lui-même). */
export function confirmationMessage(r: Reservation, ctx: ConfirmationContext): string {
  const detail = r.lines.map((l) => {
    const s = ctx.services.find((x) => x.id === l.serviceId)?.name ?? l.serviceId;
    const p = ctx.staff.find((x) => x.id === l.practitionerId)?.name ?? "—";
    const room = ctx.rooms.find((x) => x.id === l.roomId)?.name ?? "—";
    return `• ${l.start} – ${endTime(l.start, l.durationMin)} : ${s} avec ${p} (${room})`;
  });
  return [
    `Bonjour ${ctx.brand}${ctx.siteName ? ` (${ctx.siteName})` : ""}, c'est ${r.customerName}.`,
    `Je viens de réserver pour le ${formatDateLong(r.date)} (début ${r.lines[0].start}, fin vers ${reservationEnd(r.lines)}) :`,
    ...detail,
    `Référence : ${r.reference}.`,
    `J'ai envoyé l'acompte de ${formatPrice(r.depositAmount)} par Mobile Money au ${ctx.momoNumber}.`,
    "Pouvez-vous me confirmer la réception ? Merci !",
  ].join("\n");
}
