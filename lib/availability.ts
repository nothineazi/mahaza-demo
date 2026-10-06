import type { Booking, ThemeConfig } from "@/data/types";
import { minToTime, nowMinutes, timeToMin, todayISO, weekday } from "./dates";

interface SlotQuery {
  date: string;
  practitionerId: string;
  roomId: string;
  durationMin: number;
  bookings: Booking[];
  opening: ThemeConfig["opening"];
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

/** Créneaux libres pour un praticien + une salle : pas de chevauchement, dans les horaires d'ouverture. */
export function availableSlots({ date, practitionerId, roomId, durationMin, bookings, opening }: SlotQuery): string[] {
  if (opening.closedDays.includes(weekday(date))) return [];

  const open = timeToMin(opening.open);
  const close = timeToMin(opening.close);
  const isToday = date === todayISO();
  const earliest = isToday ? nowMinutes() + 30 : 0; // 30 min de préavis le jour même

  const busy = bookings
    .filter((b) => b.date === date && (b.practitionerId === practitionerId || b.roomId === roomId))
    .map((b) => [timeToMin(b.start), timeToMin(b.start) + b.durationMin] as const);

  const slots: string[] = [];
  for (let start = open; start + durationMin <= close; start += opening.slotStepMin) {
    if (start < earliest) continue;
    if (busy.some(([s, e]) => overlaps(start, start + durationMin, s, e))) continue;
    slots.push(minToTime(start));
  }
  return slots;
}

/** Montant de l'acompte, arrondi à 100 FCFA. */
export function depositFor(price: number, percent: number): number {
  return Math.round((price * percent) / 100 / 100) * 100;
}
