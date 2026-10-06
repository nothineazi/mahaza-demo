import type { Reservation, ReservationLine } from "@/data/types";
import { hoursFor } from "@/lib/availability";
import { minToTime, timeToMin } from "@/lib/dates";
import { busyOn, lineDuration, type PlanContext } from "./scheduling";

export type ConflictKind = "practitioner" | "room" | "closed" | "hours" | "practitioner_inactive" | "qualification" | "room_inactive" | "room_category";

export interface Conflict {
  kind: ConflictKind;
  /** Un conflit bloquant interdit l'enregistrement ; un avertissement non. */
  blocking: boolean;
  lineIndex: number;
  message: string;
  /** Référence de l'autre réservation en cause. */
  otherReference?: string;
}

export interface MoveInput {
  date: string;
  /** Heure de début de la première ligne (HH:mm) ; les suivantes s'enchaînent. */
  start: string;
  assignments: { practitionerId: string; roomId: string }[];
}

/** Reconstruit les lignes d'une réservation déplacée : horaires séquentiels, praticien et salle choisis. */
export function buildMovedLines(lines: ReservationLine[], input: MoveInput): ReservationLine[] {
  let t = timeToMin(input.start);
  return lines.map((l, i) => {
    const a = input.assignments[i] ?? { practitionerId: l.practitionerId, roomId: l.roomId };
    const moved: ReservationLine = {
      ...l,
      practitionerId: a.practitionerId,
      roomId: a.roomId,
      start: minToTime(t),
      noPreference: l.noPreference && a.practitionerId === l.practitionerId,
    };
    t += l.durationMin;
    return moved;
  });
}

/**
 * Conflits d'un planning proposé pour une réservation : praticien ou salle déjà occupés (réservations qui
 * occupent un créneau), jour fermé, hors horaires (bloquants) ; praticien non qualifié ou salle incompatible
 * (avertissements). `ignoreId` exclut la réservation déplacée de la recherche.
 */
export function findConflicts(ctx: PlanContext, date: string, lines: ReservationLine[], ignoreId?: string): Conflict[] {
  const out: Conflict[] = [];
  const hours = hoursFor(ctx.opening, date);
  if (!hours) {
    out.push({ kind: "closed", blocking: true, lineIndex: 0, message: "Le spa est fermé ce jour-là." });
    return out;
  }
  const open = timeToMin(hours.open);
  const close = timeToMin(hours.close);
  const busy = busyOn(ctx, date, ignoreId);
  const refOf = (id: string) => ctx.reservations.find((r) => r.id === id)?.reference;

  lines.forEach((l, i) => {
    const from = timeToMin(l.start);
    const to = from + l.durationMin;
    const service = ctx.services.find((s) => s.id === l.serviceId);
    const practitioner = ctx.staff.find((p) => p.id === l.practitionerId);
    const room = ctx.rooms.find((r) => r.id === l.roomId);

    if (from < open || to > close) {
      out.push({ kind: "hours", blocking: true, lineIndex: i, message: `Hors horaires d'ouverture (${hours.open} – ${hours.close}).` });
    }
    for (const b of busy) {
      if (!(from < b.to && b.from < to)) continue;
      if (b.practitionerId === l.practitionerId) {
        out.push({
          kind: "practitioner",
          blocking: true,
          lineIndex: i,
          message: `${practitioner?.name ?? "Praticien"} est déjà occupé(e) (${minToTime(b.from)} – ${minToTime(b.to)}).`,
          otherReference: refOf(b.reservationId),
        });
      }
      if (b.roomId === l.roomId) {
        out.push({
          kind: "room",
          blocking: true,
          lineIndex: i,
          message: `${room?.name ?? "Salle"} est déjà occupée (${minToTime(b.from)} – ${minToTime(b.to)}).`,
          otherReference: refOf(b.reservationId),
        });
      }
    }
    if (practitioner && !practitioner.active) {
      out.push({ kind: "practitioner_inactive", blocking: false, lineIndex: i, message: `${practitioner.name} est marqué(e) inactif(ve).` });
    }
    if (practitioner && service && !practitioner.serviceIds.includes(service.id)) {
      out.push({ kind: "qualification", blocking: false, lineIndex: i, message: `${practitioner.name} n'est pas assigné(e) au soin « ${service.name} ».` });
    }
    if (room && !room.active) {
      out.push({ kind: "room_inactive", blocking: false, lineIndex: i, message: `${room.name} est marquée inactive.` });
    }
    if (room && service && !room.categories.includes(service.category)) {
      out.push({ kind: "room_category", blocking: false, lineIndex: i, message: `${room.name} n'accueille pas la catégorie « ${service.category} ».` });
    }
  });
  return out;
}

export const hasBlocking = (conflicts: Conflict[]): boolean => conflicts.some((c) => c.blocking);

/** Conflits d'une réservation si on lui rend un statut qui occupe le créneau (ex. réouverture d'une annulée). */
export function conflictsForReservation(ctx: PlanContext, r: Reservation): Conflict[] {
  return findConflicts(ctx, r.date, r.lines, r.id);
}

export { lineDuration };
