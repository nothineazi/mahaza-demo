import type { Practitioner, PremiumConfig, Reservation, Service, ThemeConfig } from "@/data/types";
import { hoursFor } from "@/lib/availability";
import { addDays, timeToMin, weekDays } from "@/lib/dates";
import { occupiesSlot } from "./status";

export interface KpiContext {
  /** Réservations du spa sélectionné uniquement. */
  reservations: Reservation[];
  /** Praticiens du spa sélectionné. */
  staff: Practitioner[];
  services: Service[];
  opening: ThemeConfig["opening"];
  premium: Pick<PremiumConfig, "fictivePriceByCategory">;
  today: string;
  nowMs: number;
}

export type Period = "day" | "week";

export const periodDays = (period: Period, today: string): string[] => (period === "day" ? [today] : weekDays(today));

const inDays = (r: Reservation, days: string[]) => days.includes(r.date);

/** Réservations (hors annulées) d'une période. */
export const activeReservations = (ctx: KpiContext, days: string[]): Reservation[] =>
  ctx.reservations.filter((r) => inDays(r, days) && r.status !== "cancelled");

export function pendingDeposits(reservations: Reservation[]): { count: number; amount: number; nextExpiry: number | null } {
  const list = reservations.filter((r) => r.status === "pending_deposit");
  const expiries = list.map((r) => r.holdExpiresAt).filter((x): x is number => x != null);
  return {
    count: list.length,
    amount: list.reduce((sum, r) => sum + r.depositAmount, 0),
    nextExpiry: expiries.length ? Math.min(...expiries) : null,
  };
}

/** Minutes d'ouverture cumulées d'un praticien sur les jours donnés. */
const openMinutes = (opening: ThemeConfig["opening"], days: string[]): number =>
  days.reduce((sum, d) => {
    const h = hoursFor(opening, d);
    return sum + (h ? timeToMin(h.close) - timeToMin(h.open) : 0);
  }, 0);

/** Taux de remplissage : minutes réservées ÷ (minutes d'ouverture × praticiens actifs). `null` si capacité nulle. */
export function occupancyRate(ctx: KpiContext, days: string[]): number | null {
  const capacity = openMinutes(ctx.opening, days) * ctx.staff.filter((p) => p.active).length;
  if (capacity === 0) return null;
  const used = ctx.reservations
    .filter((r) => inDays(r, days) && occupiesSlot(r.status))
    .reduce((sum, r) => sum + r.lines.reduce((s, l) => s + l.durationMin, 0), 0);
  return Math.min(1, used / capacity);
}

/** Valeur estimée d'un soin : prix réel s'il existe, sinon barème FICTIF de la catégorie. */
export function estimatedServiceValue(service: Service | undefined, premium: KpiContext["premium"]): number {
  if (!service) return 0;
  return service.price ?? premium.fictivePriceByCategory[service.category] ?? 0;
}

export const reservationValue = (r: Reservation, ctx: Pick<KpiContext, "services" | "premium">): number =>
  r.lines.reduce((sum, l) => sum + estimatedServiceValue(ctx.services.find((s) => s.id === l.serviceId), ctx.premium), 0);

/** CA estimé : réservations confirmées ou terminées de la période (FICTIF tant que les prix sont inconnus). */
export function estimatedRevenue(ctx: KpiContext, days: string[]): number {
  return ctx.reservations
    .filter((r) => inDays(r, days) && (r.status === "confirmed" || r.status === "completed"))
    .reduce((sum, r) => sum + reservationValue(r, ctx), 0);
}

/** Rendez-vous de demain à rappeler (J-1) : confirmés ou en attente d'acompte. */
export function remindersDue(reservations: Reservation[], today: string): Reservation[] {
  const tomorrow = addDays(today, 1);
  return reservations
    .filter((r) => r.date === tomorrow && (r.status === "confirmed" || r.status === "pending_deposit"))
    .sort((a, b) => a.lines[0].start.localeCompare(b.lines[0].start));
}

export interface DayStat {
  date: string;
  count: number;
  revenue: number;
}

export function weekBreakdown(ctx: KpiContext): DayStat[] {
  return weekDays(ctx.today).map((date) => {
    const list = ctx.reservations.filter((r) => r.date === date && r.status !== "cancelled");
    return {
      date,
      count: list.length,
      revenue: list.filter((r) => r.status === "confirmed" || r.status === "completed").reduce((s, r) => s + reservationValue(r, ctx), 0),
    };
  });
}

/** Prochains rendez-vous (aujourd'hui puis à venir), triés. */
export function upcoming(reservations: Reservation[], today: string, nowMin: number, limit = 6): Reservation[] {
  return reservations
    .filter((r) => (r.status === "confirmed" || r.status === "pending_deposit") && (r.date > today || (r.date === today && timeToMin(r.lines[0].start) >= nowMin - 60)))
    .sort((a, b) => `${a.date} ${a.lines[0].start}`.localeCompare(`${b.date} ${b.lines[0].start}`))
    .slice(0, limit);
}
