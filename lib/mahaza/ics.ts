import type { Practitioner, Reservation, Room, Service } from "@/data/types";
import { timeToMin } from "@/lib/dates";
import { reservationEnd } from "./scheduling";

/** Douala = UTC+1, sans heure d'été : l'heure locale est convertie en UTC (suffixe « Z »). */
const DOUALA_OFFSET_H = 1;

export function toIcsUtc(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const min = timeToMin(time);
  const utc = new Date(Date.UTC(y, m - 1, d, 0, min - DOUALA_OFFSET_H * 60));
  return formatStamp(utc);
}

export function formatStamp(date: Date): string {
  const p = (n: number, l = 2) => n.toString().padStart(l, "0");
  return `${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}T${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`;
}

/** Échappement des valeurs TEXT (RFC 5545 §3.3.11). */
export const escapeIcsText = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Pliage des lignes à 75 octets (RFC 5545 §3.1), sans couper un caractère multi-octets. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
      limit = 74; // la ligne de continuation commence par une espace
    }
    current += ch;
    bytes += n;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export interface IcsContext {
  siteName: string;
  brand: string;
  services: Service[];
  staff: Practitioner[];
  rooms: Room[];
  /** Instant de génération (injecté pour des tests déterministes). */
  now: Date;
}

/** Fichier .ics d'une réservation : un événement couvrant l'enchaînement des soins. */
export function buildIcs(r: Reservation, ctx: IcsContext): string {
  const first = r.lines[0];
  const description = [
    "RÉSERVATION DE DÉMONSTRATION (FICTIF) : aucun rendez-vous réel.",
    `Référence : ${r.reference}`,
    ...r.lines.map((l) => {
      const s = ctx.services.find((x) => x.id === l.serviceId)?.name ?? l.serviceId;
      const p = ctx.staff.find((x) => x.id === l.practitionerId)?.name ?? "—";
      const room = ctx.rooms.find((x) => x.id === l.roomId)?.name ?? "—";
      return `${l.start} ${s} — ${p} (${room})`;
    }),
    "Durées indicatives, à confirmer par le spa.",
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${ctx.brand}//Demo reservation//FR`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${r.reference}-${r.id}@mahaza-demo.invalid`,
    `DTSTAMP:${formatStamp(ctx.now)}`,
    `DTSTART:${toIcsUtc(r.date, first.start)}`,
    `DTEND:${toIcsUtc(r.date, reservationEnd(r.lines))}`,
    `SUMMARY:${escapeIcsText(`[DÉMO] ${ctx.brand} — ${ctx.siteName}`)}`,
    `LOCATION:${escapeIcsText(`${ctx.brand} ${ctx.siteName} (adresse à confirmer)`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "STATUS:TENTATIVE",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-P1D",
    `DESCRIPTION:${escapeIcsText(`Rappel : rendez-vous ${ctx.brand} demain`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
