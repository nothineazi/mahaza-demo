import type { BookingStatus, Client, Reservation, ReservationLine, Service } from "@/data/types";
import type { DemoReservationSeed } from "@/data/mahaza-demo";
import { addDays, mondayOf, timeToMin, minToTime } from "@/lib/dates";
import { lineDuration } from "./scheduling";

export interface SeedInput {
  demo: DemoReservationSeed[];
  services: Service[];
  defaultDurationMin: number;
  referencePrefix: string;
  depositFor: (siteId: string) => number;
  today: string;
  nowMs: number;
  seedHoldMin: number;
}

const DAY_MS = 86_400_000;
const dateMs = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Statut d'une réservation seed : imposé (historique) ou dérivé de la date et de l'acompte. */
export function seedStatus(demo: DemoReservationSeed, date: string, today: string, index: number): BookingStatus {
  if (demo.status) return demo.status;
  if (date < today) {
    if (!demo.depositReceived) return "cancelled";
    return index % 9 === 4 ? "no_show" : "completed";
  }
  return demo.depositReceived ? "confirmed" : "pending_deposit";
}

/** Réservations seed (FICTIVES), datées par rapport au lundi de la semaine en cours. */
export function buildSeedReservations(input: SeedInput, clients: Client[]): Reservation[] {
  const monday = mondayOf(input.today);
  return input.demo.flatMap((d, index) => {
    const client = clients.find((c) => c.id === d.clientId);
    if (!client) return [];
    const date = addDays(monday, d.dayOffset);
    let t = timeToMin(d.start);
    const lines: ReservationLine[] = [];
    for (const l of d.lines) {
      const service = input.services.find((s) => s.id === l.serviceId);
      if (!service) return [];
      const durationMin = lineDuration(service, input.defaultDurationMin);
      lines.push({ ...l, start: minToTime(t), durationMin, noPreference: false });
      t += durationMin;
    }
    const status = seedStatus(d, date, input.today, index);
    return [
      {
        id: d.id,
        reference: `${input.referencePrefix}-${String(index + 1).padStart(4, "0")}`,
        siteId: d.siteId,
        clientId: client.id,
        customerName: client.name,
        customerPhone: client.phone,
        date,
        createdAt: dateMs(date) - 2 * DAY_MS,
        holdExpiresAt: status === "pending_deposit" ? input.nowMs + (input.seedHoldMin + (index % 5) * 15) * 60_000 : null,
        status,
        depositAmount: input.depositFor(d.siteId),
        lines,
        source: "seed" as const,
        fictive: true,
      },
    ];
  });
}
