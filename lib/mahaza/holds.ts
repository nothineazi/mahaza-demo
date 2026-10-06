import type { PremiumConfig, Reservation, Site } from "@/data/types";

/** Délai d'expiration de l'acompte (minutes) pour un spa : surcharge du site sinon valeur globale (FICTIVE). */
export const holdMinutesFor = (site: Pick<Site, "depositHoldMin">, premium: Pick<PremiumConfig, "depositHoldMin">): number =>
  site.depositHoldMin ?? premium.depositHoldMin;

export const holdExpiresAt = (nowMs: number, minutes: number): number => nowMs + minutes * 60_000;

/** Identifiants des réservations dont l'acompte a expiré (créneau à libérer). */
export function expiredHoldIds(reservations: Reservation[], nowMs: number): string[] {
  return reservations.filter((r) => r.status === "pending_deposit" && r.holdExpiresAt != null && r.holdExpiresAt <= nowMs).map((r) => r.id);
}

export const remainingMs = (expiresAt: number, nowMs: number): number => Math.max(0, expiresAt - nowMs);

/** 125 000 ms -> "02:05" ; au-delà d'une heure -> "1 h 05". */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h} h ${two(m)}` : `${two(m)}:${two(s)}`;
}
