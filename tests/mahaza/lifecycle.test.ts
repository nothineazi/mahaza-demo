import { describe, expect, it } from "vitest";
import { checkTransition, reoccupiesSlot } from "@/lib/mahaza/lifecycle";
import { expiredHoldIds, formatCountdown, holdExpiresAt, holdMinutesFor, remainingMs } from "@/lib/mahaza/holds";
import { occupiesSlot, isDepositReceived } from "@/lib/mahaza/status";
import { premium, reservation, TODAY } from "./fixtures";

const line = { serviceId: "vi-soin-eclat", practitionerId: "p", roomId: "r", start: "10:00", durationMin: 60, noPreference: false };

describe("cycle de vie", () => {
  it("autorise les transitions prévues et refuse les autres", () => {
    expect(checkTransition({ status: "pending_deposit", date: "2026-10-20" }, "confirmed", TODAY).ok).toBe(true);
    expect(checkTransition({ status: "pending_deposit", date: "2026-10-20" }, "completed", TODAY).ok).toBe(false);
    expect(checkTransition({ status: "completed", date: "2026-10-01" }, "cancelled", TODAY).ok).toBe(false);
    expect(checkTransition({ status: "cancelled", date: "2026-10-20" }, "confirmed", TODAY).ok).toBe(true);
    expect(checkTransition({ status: "confirmed", date: "2026-10-20" }, "confirmed", TODAY).ok).toBe(false);
  });

  it("terminée / no-show seulement à partir du jour du rendez-vous", () => {
    expect(checkTransition({ status: "confirmed", date: "2026-10-08" }, "completed", TODAY)).toMatchObject({ ok: false });
    expect(checkTransition({ status: "confirmed", date: "2026-10-08" }, "no_show", TODAY)).toMatchObject({ ok: false });
    expect(checkTransition({ status: "confirmed", date: TODAY }, "completed", TODAY).ok).toBe(true);
    expect(checkTransition({ status: "confirmed", date: "2026-10-01" }, "no_show", TODAY).ok).toBe(true);
  });

  it("une réouverture reprend un créneau ; une annulation non", () => {
    expect(reoccupiesSlot("cancelled", "confirmed")).toBe(true);
    expect(reoccupiesSlot("no_show", "confirmed")).toBe(true);
    expect(reoccupiesSlot("confirmed", "cancelled")).toBe(false);
    expect(occupiesSlot("cancelled")).toBe(false);
    expect(occupiesSlot("no_show")).toBe(false);
    expect(isDepositReceived("confirmed")).toBe(true);
    expect(isDepositReceived("pending_deposit")).toBe(false);
  });
});

describe("expiration d'acompte", () => {
  const now = Date.UTC(2026, 9, 7, 8, 0);
  const pending = (id: string, expires: number | null) => reservation({ id, status: "pending_deposit", holdExpiresAt: expires, lines: [line] });

  it("ne retient que les acomptes en attente dont l'échéance est atteinte", () => {
    const list = [pending("a", now - 1), pending("b", now), pending("c", now + 1), pending("d", null), reservation({ id: "e", status: "confirmed", holdExpiresAt: now - 5, lines: [line] })];
    expect(expiredHoldIds(list, now)).toEqual(["a", "b"]);
  });

  it("délai : surcharge du site sinon valeur globale ; compte à rebours formaté", () => {
    expect(holdMinutesFor({}, premium)).toBe(premium.depositHoldMin);
    expect(holdMinutesFor({ depositHoldMin: 10 }, premium)).toBe(10);
    expect(holdExpiresAt(now, 30)).toBe(now + 30 * 60_000);
    expect(remainingMs(now - 10, now)).toBe(0);
    expect(formatCountdown(125_000)).toBe("02:05");
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(3_900_000)).toBe("1 h 05");
  });
});
