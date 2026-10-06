import { describe, expect, it } from "vitest";
import { theme } from "@/theme.config";
import { buildIcs, escapeIcsText, foldLine, toIcsUtc } from "@/lib/mahaza/ics";
import { csvCell, reservationsToCsv, toCsv } from "@/lib/mahaza/csv";
import { reminderLink, reminderMessage } from "@/lib/mahaza/reminders";
import { generateGiftCode, giftCardMessage, giftCardWaLink, validateGiftAmount } from "@/lib/mahaza/gift-card";
import { cartDurationLabel, cartTotalDuration } from "@/lib/mahaza/cart";
import { loyaltyFor } from "@/lib/mahaza/loyalty";
import { phoneKey } from "@/lib/mahaza/phone";
import { formatPrice } from "@/lib/utils";
import { premium, reservation } from "./fixtures";

const SITE = "douala-bonapriso";
const two = reservation({
  customerName: "Carine Mbarga",
  date: "2026-10-13",
  lines: [
    { serviceId: "vi-soin-eclat", practitionerId: `${SITE}-p2`, roomId: `${SITE}-r-visage`, start: "10:00", durationMin: 60, noPreference: true },
    { serviceId: "mp-manucure-spa", practitionerId: `${SITE}-p1`, roomId: `${SITE}-r-mains`, start: "11:00", durationMin: 60, noPreference: false },
  ],
});

describe("ICS", () => {
  const ics = buildIcs(two, { siteName: "Douala Bonapriso", brand: "Mahaza Beauty", services: theme.services, staff: theme.practitioners, rooms: theme.rooms, now: new Date(Date.UTC(2026, 9, 7, 8, 0, 0)) });

  it("convertit l'heure de Douala (UTC+1) en UTC", () => {
    expect(toIcsUtc("2026-10-13", "09:00")).toBe("20261013T080000Z");
    expect(toIcsUtc("2026-10-13", "00:30")).toBe("20261012T233000Z");
    expect(ics).toContain("DTSTART:20261013T090000Z");
    expect(ics).toContain("DTEND:20261013T110000Z");
    expect(ics).toContain("DTSTAMP:20261007T080000Z");
  });

  it("structure valide : CRLF, VCALENDAR/VEVENT/VALARM, préfixe [DÉMO], aucune adresse inventée", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("SUMMARY:[DÉMO] Mahaza Beauty — Douala Bonapriso");
    expect(ics).toContain("adresse à confirmer");
    expect(ics).toContain("UID:MAH-T001-t1@mahaza-demo.invalid");
  });

  it("aucune ligne ne dépasse 75 octets ; le contenu replié se reconstitue", () => {
    const enc = new TextEncoder();
    for (const l of ics.split("\r\n")) expect(enc.encode(l).length).toBeLessThanOrEqual(75);
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("Soin éclat");
    expect(unfolded).toContain("Manucure spa");
  });

  it("échappe , ; \\ et les retours à la ligne ; ne coupe pas un caractère multi-octets", () => {
    expect(escapeIcsText("a,b;c\\d\ne")).toBe("a\\,b\;c\\\\d\\ne");
    const folded = foldLine("X:" + "é".repeat(80));
    expect(folded.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe("X:" + "é".repeat(80));
  });
});

describe("CSV", () => {
  it("BOM, séparateur « ; », guillemets doublés, CRLF", () => {
    const csv = toCsv([["a", 'b"c', "d;e"], [1, true, null]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe('﻿a;"b""c";"d;e"\r\n1;true;\r\n');
  });

  it("neutralise l'injection de formules", () => {
    for (const bad of ["=SUM(1+1)", "+33 1", "-2+3", "@cmd", "\tx"]) expect(csvCell(bad).replace(/^"|"$/g, "").startsWith("'")).toBe(true);
    expect(csvCell("Carine")).toBe("Carine");
  });

  it("exporte une ligne par réservation avec le marquage FICTIF", () => {
    const csv = reservationsToCsv([{ ...two, fictive: true, customerName: "=HYPERLINK(\"x\")" }], { siteName: "Douala Bonapriso", services: theme.services, staff: theme.practitioners, rooms: theme.rooms });
    const rows = csv.trim().split("\r\n");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("Référence;Statut;Date");
    expect(rows[1]).toContain("Soin éclat + Manucure spa");
    expect(rows[1]).toContain("FICTIF (démo)");
    expect(rows[1]).toContain("'=HYPERLINK");
    expect(rows[1]).toContain(";10:00;12:00;");
  });
});

describe("rappel J-1 WhatsApp", () => {
  const ctx = { brand: "Mahaza Beauty", siteName: "Douala Bonapriso", services: theme.services, staff: theme.practitioners };
  it("pré-remplit le message et vise le téléphone du client", () => {
    const msg = reminderMessage(two, ctx);
    expect(msg).toContain("Bonjour Carine");
    expect(msg).toContain("demain");
    expect(msg).toContain("10:00");
    expect(msg).toContain("MAH-T001");
    const link = reminderLink(two, ctx);
    expect(link.startsWith("https://wa.me/237600000099?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe(msg);
  });
  it("relance l'acompte si la réservation est en attente", () => {
    expect(reminderMessage({ ...two, status: "pending_deposit" }, ctx)).toContain("acompte");
    expect(reminderMessage(two, ctx)).not.toContain("acompte");
  });
});

describe("cartes cadeaux", () => {
  it("code fictif au bon format et alphabet sans caractères ambigus", () => {
    for (let i = 0; i < 50; i++) expect(generateGiftCode()).toMatch(/^GC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(generateGiftCode(() => new Uint8Array(8))).toBe("GC-AAAA-AAAA");
  });
  it("valide le montant libre dans la fourchette et au pas configuré", () => {
    const cfg = premium.giftCard;
    expect(validateGiftAmount(20000, cfg)).toEqual({ ok: true, amount: 20000 });
    expect(validateGiftAmount("45 000", cfg)).toEqual({ ok: true, amount: 45000 });
    expect(validateGiftAmount(15000, cfg).ok).toBe(false);
    expect(validateGiftAmount(105000, cfg).ok).toBe(false);
    expect(validateGiftAmount(22500, cfg).ok).toBe(false);
    expect(validateGiftAmount("abc", cfg).ok).toBe(false);
  });
  it("lien wa.me avec ou sans destinataire, message encodé", () => {
    const msg = giftCardMessage({ code: "GC-ABCD-EFGH", amount: 40000, from: "Ruth", to: "Flore", message: "Joyeux anniversaire & à bientôt" }, "Mahaza Beauty");
    expect(msg).toContain(formatPrice(40000));
    expect(msg).toContain("GC-ABCD-EFGH");
    expect(msg).toContain("non valable");
    expect(giftCardWaLink("+237 6 70 00 00 01", msg).startsWith("https://wa.me/237670000001?text=")).toBe(true);
    expect(giftCardWaLink("", msg).startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(giftCardWaLink("", msg).split("text=")[1])).toBe(msg);
  });
});

describe("panier, fidélité, téléphone", () => {
  it("durée cumulée uniquement si toutes les durées sont renseignées", () => {
    expect(cartTotalDuration([{ durationMin: 30 }, { durationMin: 45 }])).toBe(75);
    expect(cartDurationLabel([{ durationMin: 30 }, { durationMin: 45 }])).toBe("1 h 15");
    expect(cartTotalDuration([{ durationMin: 30 }, {}])).toBeNull();
    expect(cartDurationLabel([{}, {}])).toBeNull();
    expect(cartTotalDuration([])).toBeNull();
  });
  it("points, palier et progression", () => {
    const l = premium.loyalty;
    expect(loyaltyFor({ bonusPoints: 0 }, ["completed", "cancelled", "no_show"], l)).toMatchObject({ points: 10, visits: 1, tier: { label: "Découverte" }, toNext: 20 });
    const gold = loyaltyFor({ bonusPoints: 5 }, ["completed", "completed", "completed", "completed", "completed", "completed"], l);
    expect(gold).toMatchObject({ points: 65, tier: { label: "Or" }, next: null, progress: 1 });
    expect(loyaltyFor({ bonusPoints: 0 }, ["completed", "completed", "completed"], l).tier.label).toBe("Argent");
  });
  it("rapproche un numéro malgré indicatif et espaces", () => {
    expect(phoneKey("+237 6 70 00 00 01")).toBe(phoneKey("670000001"));
    expect(phoneKey("6 70 00 00 01")).toBe("670000001");
  });
});
