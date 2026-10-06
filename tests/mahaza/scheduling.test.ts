import { describe, expect, it } from "vitest";
import { availableStarts, planLines, reservationEnd } from "@/lib/mahaza/scheduling";
import { buildMovedLines, findConflicts, hasBlocking } from "@/lib/mahaza/conflicts";
import { ctxFor, reservation, SITE } from "./fixtures";

const P = (n: number) => `${SITE}-p${n}`;
const R = (k: string) => `${SITE}-r-${k}`;
const FACE = "vi-soin-eclat";
const NAILS = "mp-manucure-spa";
const DATE = "2026-10-13"; // mardi, futur

describe("planLines", () => {
  it("enchaîne deux soins sans chevauchement, praticien et salle attribués automatiquement", () => {
    const res = planLines(ctxFor([]), DATE, 10 * 60, [
      { serviceId: FACE, practitionerId: null },
      { serviceId: NAILS, practitionerId: null },
    ]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.lines.map((l) => l.start)).toEqual(["10:00", "11:00"]);
    expect(res.lines.every((l) => l.noPreference)).toBe(true);
    expect(reservationEnd(res.lines)).toBe("12:00");
    expect(res.lines[0].practitionerId).toBe(P(2));
    expect(res.lines[1].practitionerId).toBe(P(1));
  });

  it("refuse un créneau qui dépasse la fermeture et un créneau avant l'ouverture", () => {
    const ctx = ctxFor([]);
    expect(planLines(ctx, DATE, 19 * 60 + 30, [{ serviceId: FACE, practitionerId: null }])).toEqual({ ok: false, reason: "outside_hours" });
    expect(planLines(ctx, DATE, 7 * 60, [{ serviceId: FACE, practitionerId: null }])).toEqual({ ok: false, reason: "outside_hours" });
    // panier de 3 soins qui déborde à la fermeture
    const three = [FACE, FACE, FACE].map((serviceId) => ({ serviceId, practitionerId: null }));
    expect(planLines(ctx, DATE, 18 * 60 + 30, three).ok).toBe(false);
  });

  it("applique le préavis de 30 minutes le jour même", () => {
    const ctx = ctxFor([], SITE, 10 * 60);
    expect(planLines(ctx, "2026-10-07", 10 * 60 + 15, [{ serviceId: FACE, practitionerId: null }])).toEqual({ ok: false, reason: "too_soon" });
    expect(planLines(ctx, "2026-10-07", 10 * 60 + 30, [{ serviceId: FACE, practitionerId: null }]).ok).toBe(true);
  });

  it("praticien choisi occupé -> refus ; « sans préférence » -> un autre praticien qualifié", () => {
    const busy = reservation({
      date: DATE,
      lines: [{ serviceId: FACE, practitionerId: P(2), roomId: R("visage"), start: "10:00", durationMin: 60, noPreference: false }],
    });
    const ctx = ctxFor([busy]);
    expect(planLines(ctx, DATE, 10 * 60, [{ serviceId: FACE, practitionerId: P(2) }])).toEqual({ ok: false, reason: "no_practitioner" });
    // Autre soin de la même salle : la salle est occupée.
    const brow = "ep-sourcils";
    expect(planLines(ctx, DATE, 10 * 60, [{ serviceId: brow, practitionerId: null }])).toEqual({ ok: false, reason: "no_practitioner" });
    expect(planLines(ctx, DATE, 11 * 60, [{ serviceId: FACE, practitionerId: P(2) }]).ok).toBe(true);
  });

  it("une réservation annulée libère le créneau", () => {
    const cancelled = reservation({
      date: DATE,
      status: "cancelled",
      lines: [{ serviceId: FACE, practitionerId: P(2), roomId: R("visage"), start: "10:00", durationMin: 60, noPreference: false }],
    });
    expect(planLines(ctxFor([cancelled]), DATE, 10 * 60, [{ serviceId: FACE, practitionerId: P(2) }]).ok).toBe(true);
  });

  it("n'affecte pas un praticien non qualifié ni une salle incompatible", () => {
    const res = planLines(ctxFor([]), DATE, 10 * 60, [{ serviceId: FACE, practitionerId: P(1) }]);
    expect(res).toEqual({ ok: false, reason: "no_practitioner" });
  });
});

describe("availableStarts", () => {
  it("ne propose que des débuts valides pour tout le panier", () => {
    const wanted = [
      { serviceId: FACE, practitionerId: null },
      { serviceId: NAILS, practitionerId: null },
    ];
    const ctx = ctxFor([]);
    const starts = availableStarts(ctx, DATE, wanted);
    expect(starts[0]).toBe("08:30");
    // 2 soins de 60 min : le dernier début est 18:00 (fin 20:00)
    expect(starts[starts.length - 1]).toBe("18:00");
    expect(starts.every((s) => planLines(ctx, DATE, Number(s.slice(0, 2)) * 60 + Number(s.slice(3)), wanted).ok)).toBe(true);
  });

  it("un jour fermé ou un panier vide ne donne aucun créneau", () => {
    expect(availableStarts(ctxFor([]), DATE, [])).toEqual([]);
  });

  it("retire les débuts qui entrent en conflit avec une réservation existante", () => {
    const busy = reservation({
      date: DATE,
      lines: [{ serviceId: FACE, practitionerId: P(2), roomId: R("visage"), start: "10:00", durationMin: 60, noPreference: false }],
    });
    const starts = availableStarts(ctxFor([busy]), DATE, [{ serviceId: FACE, practitionerId: P(2) }]);
    expect(starts).not.toContain("10:00");
    expect(starts).not.toContain("09:30");
    expect(starts).toContain("11:00");
    expect(starts).toContain("09:00");
  });
});

describe("findConflicts / buildMovedLines", () => {
  const base = reservation({
    id: "a",
    reference: "MAH-A",
    date: DATE,
    lines: [{ serviceId: FACE, practitionerId: P(2), roomId: R("visage"), start: "10:00", durationMin: 60, noPreference: false }],
  });
  const other = reservation({
    id: "b",
    reference: "MAH-B",
    date: DATE,
    lines: [{ serviceId: "ep-sourcils", practitionerId: P(2), roomId: R("visage"), start: "14:00", durationMin: 60, noPreference: false }],
  });

  it("détecte un conflit praticien ET salle avec la référence de l'autre réservation", () => {
    const moved = buildMovedLines(base.lines, { date: DATE, start: "14:30", assignments: [{ practitionerId: P(2), roomId: R("visage") }] });
    const c = findConflicts(ctxFor([base, other]), DATE, moved, base.id);
    expect(c.map((x) => x.kind).sort()).toEqual(["practitioner", "room"]);
    expect(c.every((x) => x.blocking && x.otherReference === "MAH-B")).toBe(true);
    expect(hasBlocking(c)).toBe(true);
  });

  it("aucun conflit sur un créneau libre ; la réservation déplacée est ignorée", () => {
    const moved = buildMovedLines(base.lines, { date: DATE, start: "10:30", assignments: [{ practitionerId: P(2), roomId: R("visage") }] });
    expect(findConflicts(ctxFor([base, other]), DATE, moved, base.id)).toEqual([]);
  });

  it("changement de salle seul : conflit de salle uniquement", () => {
    const moved = buildMovedLines(base.lines, { date: DATE, start: "14:00", assignments: [{ practitionerId: P(3), roomId: R("visage") }] });
    const c = findConflicts(ctxFor([base, other]), DATE, moved, base.id);
    expect(c.filter((x) => x.blocking).map((x) => x.kind)).toEqual(["room"]);
  });

  it("hors horaires = bloquant ; praticien non qualifié / salle incompatible = avertissements", () => {
    const late = buildMovedLines(base.lines, { date: DATE, start: "19:30", assignments: [{ practitionerId: P(2), roomId: R("visage") }] });
    expect(findConflicts(ctxFor([base]), DATE, late, base.id).some((x) => x.kind === "hours" && x.blocking)).toBe(true);

    const wrong = buildMovedLines(base.lines, { date: DATE, start: "10:00", assignments: [{ practitionerId: P(1), roomId: R("corps") }] });
    const c = findConflicts(ctxFor([base]), DATE, wrong, base.id);
    expect(c.map((x) => x.kind).sort()).toEqual(["qualification", "room_category"]);
    expect(hasBlocking(c)).toBe(false);
  });

  it("les lignes déplacées s'enchaînent depuis la nouvelle heure", () => {
    const two = reservation({
      lines: [
        { serviceId: FACE, practitionerId: P(2), roomId: R("visage"), start: "10:00", durationMin: 60, noPreference: true },
        { serviceId: NAILS, practitionerId: P(1), roomId: R("mains"), start: "11:00", durationMin: 60, noPreference: true },
      ],
    });
    const moved = buildMovedLines(two.lines, {
      date: DATE,
      start: "15:00",
      assignments: [
        { practitionerId: P(2), roomId: R("visage") },
        { practitionerId: P(1), roomId: R("mains") },
      ],
    });
    expect(moved.map((l) => l.start)).toEqual(["15:00", "16:00"]);
    expect(moved.map((l) => l.noPreference)).toEqual([true, true]);
  });
});
