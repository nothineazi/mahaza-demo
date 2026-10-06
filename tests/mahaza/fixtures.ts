import { theme } from "@/theme.config";
import { mahazaClients, mahazaDemoReservations } from "@/data/mahaza-demo";
import { buildSeedReservations } from "@/lib/mahaza/seed";
import type { PlanContext } from "@/lib/mahaza/scheduling";
import type { Reservation } from "@/data/types";

/** Mercredi 7 octobre 2026 ; lundi de la semaine = 5 octobre. */
export const TODAY = "2026-10-07";
export const NOW_MS = Date.UTC(2026, 9, 7, 8, 0);
export const SITE = "douala-bonapriso";

export const premium = theme.premium!;

export function seedAll(): Reservation[] {
  return buildSeedReservations(
    {
      demo: mahazaDemoReservations,
      services: theme.services,
      defaultDurationMin: theme.defaultDurationMin ?? 60,
      referencePrefix: theme.referencePrefix,
      depositFor: () => 5000,
      today: TODAY,
      nowMs: NOW_MS,
      seedHoldMin: premium.seedHoldMin,
    },
    mahazaClients,
  );
}

export function ctxFor(reservations: Reservation[], siteId = SITE, nowMin = 8 * 60): PlanContext {
  return {
    siteId,
    services: theme.services,
    staff: theme.practitioners,
    rooms: theme.rooms,
    reservations,
    opening: theme.opening,
    defaultDurationMin: theme.defaultDurationMin ?? 60,
    today: TODAY,
    nowMin,
  };
}

export function reservation(partial: Partial<Reservation> & Pick<Reservation, "lines">): Reservation {
  return {
    id: "t1",
    reference: "MAH-T001",
    siteId: SITE,
    clientId: "c-test",
    customerName: "Test Client",
    customerPhone: "+237 600 00 00 99",
    date: "2026-10-12",
    createdAt: NOW_MS,
    holdExpiresAt: null,
    status: "confirmed",
    depositAmount: 5000,
    source: "web",
    ...partial,
  };
}
