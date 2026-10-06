import { describe, expect, it } from "vitest";
import { theme } from "@/theme.config";
import { estimatedRevenue, estimatedServiceValue, occupancyRate, pendingDeposits, periodDays, remindersDue, upcoming, weekBreakdown, type KpiContext } from "@/lib/mahaza/kpis";
import { NOW_MS, premium, reservation, seedAll, SITE, TODAY } from "./fixtures";

const staff = theme.practitioners.filter((p) => p.siteId === SITE);
const ctxOf = (reservations: ReturnType<typeof seedAll>): KpiContext => ({
  reservations, staff, services: theme.services, opening: theme.opening, premium, today: TODAY, nowMs: NOW_MS,
});
const line = (start: string, serviceId = "vi-soin-eclat") => ({ serviceId, practitionerId: `${SITE}-p2`, roomId: `${SITE}-r-visage`, start, durationMin: 60, noPreference: false });

describe("KPIs du tableau de bord (FICTIF)", () => {
  it("taux de remplissage : minutes réservées / (ouverture × praticiens actifs)", () => {
    // mercredi : 8h30-20h = 690 min × 6 praticiens = 4140 ; 2 soins de 60 min = 120
    const list = [reservation({ id: "1", date: TODAY, lines: [line("10:00")] }), reservation({ id: "2", date: TODAY, status: "pending_deposit", lines: [line("14:00")] })];
    expect(occupancyRate(ctxOf(list), [TODAY])).toBeCloseTo(120 / 4140, 5);
    // annulées et no-show ne comptent pas
    const cancelled = [reservation({ id: "1", date: TODAY, status: "cancelled", lines: [line("10:00")] }), reservation({ id: "2", date: TODAY, status: "no_show", lines: [line("12:00")] })];
    expect(occupancyRate(ctxOf(cancelled), [TODAY])).toBe(0);
    expect(occupancyRate({ ...ctxOf([]), staff: [] }, [TODAY])).toBeNull();
  });

  it("CA estimé : confirmées + terminées, barème fictif par catégorie ; le prix réel prime", () => {
    const list = [
      reservation({ id: "1", date: TODAY, lines: [line("10:00"), line("11:00", "mp-manucure-spa")] }),
      reservation({ id: "2", date: TODAY, status: "pending_deposit", lines: [line("14:00")] }),
      reservation({ id: "3", date: TODAY, status: "completed", lines: [line("15:00")] }),
    ];
    const fictiveFace = premium.fictivePriceByCategory["Soin de visage"];
    const fictiveNails = premium.fictivePriceByCategory["Beauté des mains et des pieds"];
    expect(estimatedRevenue(ctxOf(list), [TODAY])).toBe(2 * fictiveFace + fictiveNails);
    expect(estimatedServiceValue({ id: "x", name: "x", category: "Soin de visage", price: 1234 }, premium)).toBe(1234);
    expect(estimatedServiceValue(undefined, premium)).toBe(0);
  });

  it("acomptes en attente : nombre, montant, prochaine échéance", () => {
    const list = [
      reservation({ id: "1", status: "pending_deposit", holdExpiresAt: NOW_MS + 600_000, depositAmount: 5000, lines: [line("10:00")] }),
      reservation({ id: "2", status: "pending_deposit", holdExpiresAt: NOW_MS + 300_000, depositAmount: 5000, lines: [line("11:00")] }),
      reservation({ id: "3", status: "confirmed", lines: [line("12:00")] }),
    ];
    expect(pendingDeposits(list)).toEqual({ count: 2, amount: 10000, nextExpiry: NOW_MS + 300_000 });
    expect(pendingDeposits([])).toEqual({ count: 0, amount: 0, nextExpiry: null });
  });

  it("rappels J-1 : seulement demain, confirmées ou en attente, triées", () => {
    const list = [
      reservation({ id: "1", date: "2026-10-08", lines: [line("15:00")] }),
      reservation({ id: "2", date: "2026-10-08", status: "pending_deposit", lines: [line("09:00")] }),
      reservation({ id: "3", date: "2026-10-08", status: "cancelled", lines: [line("10:00")] }),
      reservation({ id: "4", date: "2026-10-09", lines: [line("10:00")] }),
    ];
    expect(remindersDue(list, TODAY).map((r) => r.id)).toEqual(["2", "1"]);
  });

  it("sur les données seed : cohérence jour / semaine", () => {
    const all = seedAll().filter((r) => r.siteId === SITE);
    const ctx = ctxOf(all);
    const week = periodDays("week", TODAY);
    expect(week).toHaveLength(7);
    expect(week[0]).toBe("2026-10-05");
    const bd = weekBreakdown(ctx);
    expect(bd.reduce((s, d) => s + d.count, 0)).toBe(all.filter((r) => week.includes(r.date) && r.status !== "cancelled").length);
    expect(bd.reduce((s, d) => s + d.revenue, 0)).toBe(estimatedRevenue(ctx, week));
    expect(upcoming(all, TODAY, 0).every((r) => r.date >= TODAY)).toBe(true);
  });
});
