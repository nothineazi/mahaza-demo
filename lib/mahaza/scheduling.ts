import type { Practitioner, Reservation, ReservationLine, Room, Service, ThemeConfig } from "@/data/types";
import { hoursFor } from "@/lib/availability";
import { minToTime, timeToMin } from "@/lib/dates";
import { occupiesSlot } from "./status";

/** Contexte d'ordonnancement d'un spa : tout est passé en paramètre (fonctions pures, testables). */
export interface PlanContext {
  siteId: string;
  services: Service[];
  staff: Practitioner[];
  rooms: Room[];
  reservations: Reservation[];
  opening: ThemeConfig["opening"];
  /** Durée du créneau d'un service sans durée (FICTIVE). */
  defaultDurationMin: number;
  /** Date du jour (YYYY-MM-DD) et minutes écoulées : sert au préavis du jour même. */
  today: string;
  nowMin: number;
}

/** Préavis minimal le jour même, en minutes. */
export const NOTICE_MIN = 30;

export interface Wanted {
  serviceId: string;
  /** null = « sans préférence » : un praticien qualifié et libre est attribué automatiquement. */
  practitionerId: string | null;
}

export type PlanFailure = "closed" | "outside_hours" | "too_soon" | "no_practitioner" | "no_room" | "unknown_service";

export type PlanResult = { ok: true; lines: ReservationLine[] } | { ok: false; reason: PlanFailure };

export const FAILURE_LABELS: Record<PlanFailure, string> = {
  closed: "Le spa est fermé ce jour-là.",
  outside_hours: "Le créneau dépasse les horaires d'ouverture.",
  too_soon: "Ce créneau est trop proche (préavis de 30 minutes).",
  no_practitioner: "Aucun praticien disponible sur ce créneau.",
  no_room: "Aucune salle compatible disponible sur ce créneau.",
  unknown_service: "Soin inconnu.",
};

export const lineDuration = (service: Pick<Service, "durationMin">, defaultDurationMin: number): number =>
  service.durationMin ?? defaultDurationMin;

const overlaps = (aFrom: number, aTo: number, bFrom: number, bTo: number) => aFrom < bTo && bFrom < aTo;

interface Busy {
  from: number;
  to: number;
  practitionerId: string;
  roomId: string;
  reservationId: string;
}

/** Créneaux occupés d'un jour pour un spa (hors réservation ignorée). */
export function busyOn(ctx: Pick<PlanContext, "siteId" | "reservations">, date: string, ignoreId?: string): Busy[] {
  const out: Busy[] = [];
  for (const r of ctx.reservations) {
    if (r.siteId !== ctx.siteId || r.date !== date || r.id === ignoreId || !occupiesSlot(r.status)) continue;
    for (const l of r.lines) {
      const from = timeToMin(l.start);
      out.push({ from, to: from + l.durationMin, practitionerId: l.practitionerId, roomId: l.roomId, reservationId: r.id });
    }
  }
  return out;
}

/**
 * Affecte, ligne par ligne, un praticien et une salle libres à partir de `startMin`.
 * Les soins s'enchaînent ; en « sans préférence », on privilégie la continuité (même praticien / salle que
 * le soin précédent) puis le praticien le moins chargé de la journée.
 */
export function planLines(ctx: PlanContext, date: string, startMin: number, wanted: Wanted[], ignoreId?: string): PlanResult {
  const hours = hoursFor(ctx.opening, date);
  if (!hours) return { ok: false, reason: "closed" };
  const open = timeToMin(hours.open);
  const close = timeToMin(hours.close);
  if (startMin < open) return { ok: false, reason: "outside_hours" };
  if (date === ctx.today && startMin < ctx.nowMin + NOTICE_MIN) return { ok: false, reason: "too_soon" };

  const busy = busyOn(ctx, date, ignoreId);
  const load = new Map<string, number>();
  for (const b of busy) load.set(b.practitionerId, (load.get(b.practitionerId) ?? 0) + (b.to - b.from));

  const lines: ReservationLine[] = [];
  let t = startMin;
  let prevPractitioner: string | null = null;
  let prevRoom: string | null = null;

  for (const want of wanted) {
    const service = ctx.services.find((s) => s.id === want.serviceId);
    if (!service) return { ok: false, reason: "unknown_service" };
    const duration = lineDuration(service, ctx.defaultDurationMin);
    const end = t + duration;
    if (end > close) return { ok: false, reason: "outside_hours" };

    const qualified = ctx.staff.filter((p) => p.active && (p.siteId ?? ctx.siteId) === ctx.siteId && p.serviceIds.includes(service.id));
    const candidates = want.practitionerId
      ? qualified.filter((p) => p.id === want.practitionerId)
      : [...qualified].sort(
          (a, b) =>
            Number(b.id === prevPractitioner) - Number(a.id === prevPractitioner) ||
            (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0) ||
            a.id.localeCompare(b.id),
        );
    const roomsOk = ctx.rooms
      .filter((r) => r.active && (r.siteId ?? ctx.siteId) === ctx.siteId && r.categories.includes(service.category))
      .sort((a, b) => Number(b.id === prevRoom) - Number(a.id === prevRoom) || a.id.localeCompare(b.id));

    const freePractitioners = candidates.filter((p) => !busy.some((b) => b.practitionerId === p.id && overlaps(t, end, b.from, b.to)));
    if (freePractitioners.length === 0) return { ok: false, reason: "no_practitioner" };
    const freeRoom = roomsOk.find((r) => !busy.some((b) => b.roomId === r.id && overlaps(t, end, b.from, b.to)));
    if (!freeRoom) return { ok: false, reason: "no_room" };

    const practitioner = freePractitioners[0];
    lines.push({
      serviceId: service.id,
      practitionerId: practitioner.id,
      roomId: freeRoom.id,
      start: minToTime(t),
      durationMin: duration,
      noPreference: want.practitionerId == null,
    });
    prevPractitioner = practitioner.id;
    prevRoom = freeRoom.id;
    t = end;
  }
  return { ok: true, lines };
}

/** Heures de début possibles pour un panier complet, à un jour donné. */
export function availableStarts(ctx: PlanContext, date: string, wanted: Wanted[], ignoreId?: string): string[] {
  const hours = hoursFor(ctx.opening, date);
  if (!hours || wanted.length === 0) return [];
  const open = timeToMin(hours.open);
  const close = timeToMin(hours.close);
  const out: string[] = [];
  for (let t = open; t < close; t += ctx.opening.slotStepMin) {
    if (planLines(ctx, date, t, wanted, ignoreId).ok) out.push(minToTime(t));
  }
  return out;
}

export const reservationEnd = (lines: ReservationLine[]): string => {
  const last = lines[lines.length - 1];
  return minToTime(timeToMin(last.start) + last.durationMin);
};
