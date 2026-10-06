import { describe, expect, it } from "vitest";
import { theme } from "@/theme.config";
import { mahazaClients } from "@/data/mahaza-demo";
import { occupiesSlot } from "@/lib/mahaza/status";
import { timeToMin } from "@/lib/dates";
import { seedAll } from "./fixtures";

describe("données seed Mahaza (FICTIF)", () => {
  const all = seedAll();

  it("toutes les réservations pointent vers un client, un praticien, une salle et un service existants", () => {
    for (const r of all) {
      expect(mahazaClients.some((c) => c.id === r.clientId)).toBe(true);
      for (const l of r.lines) {
        expect(theme.services.some((s) => s.id === l.serviceId)).toBe(true);
        expect(theme.practitioners.find((p) => p.id === l.practitionerId)?.siteId).toBe(r.siteId);
        expect(theme.rooms.find((x) => x.id === l.roomId)?.siteId).toBe(r.siteId);
      }
    }
  });

  it("aucun chevauchement de praticien ou de salle entre réservations qui occupent un créneau", () => {
    const busy = all.filter((r) => occupiesSlot(r.status)).flatMap((r) => r.lines.map((l) => ({ r, l, from: timeToMin(l.start), to: timeToMin(l.start) + l.durationMin })));
    for (let i = 0; i < busy.length; i++) {
      for (let j = i + 1; j < busy.length; j++) {
        const a = busy[i];
        const b = busy[j];
        if (a.r.siteId !== b.r.siteId || a.r.date !== b.r.date) continue;
        if (!(a.from < b.to && b.from < a.to)) continue;
        expect([a.r.reference, b.r.reference, a.l.practitionerId === b.l.practitionerId, a.l.roomId === b.l.roomId]).toEqual([a.r.reference, b.r.reference, false, false]);
      }
    }
  });

  it("les références sont uniques et chaque client a au moins un historique", () => {
    expect(new Set(all.map((r) => r.reference)).size).toBe(all.length);
    for (const c of mahazaClients) expect(all.filter((r) => r.clientId === c.id).length).toBeGreaterThanOrEqual(2);
  });

  it("tout est marqué FICTIF et les acomptes en attente ont une échéance", () => {
    expect(all.every((r) => r.fictive)).toBe(true);
    expect(mahazaClients.every((c) => c.fictive)).toBe(true);
    for (const r of all) expect(r.status === "pending_deposit" ? r.holdExpiresAt != null : r.holdExpiresAt == null).toBe(true);
  });

  it("couvre les cinq statuts", () => {
    expect(new Set(all.map((r) => r.status))).toEqual(new Set(["pending_deposit", "confirmed", "completed", "cancelled", "no_show"]));
  });
});
