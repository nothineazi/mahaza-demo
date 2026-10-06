import type { Practitioner, Reservation, Room, Service } from "@/data/types";
import { endTime } from "@/lib/dates";
import { STATUS_LABELS, isDepositReceived } from "./status";
import { reservationEnd } from "./scheduling";

const SEP = ";";
const BOM = "\uFEFF";

/**
 * Cellule CSV : les valeurs commençant par = + - @ (ou tabulation / retour chariot) sont préfixées d'une
 * apostrophe pour éviter l'injection de formules à l'ouverture dans un tableur ; guillemets doublés.
 */
export function csvCell(value: string | number | boolean | null | undefined): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\r\n]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV UTF-8 avec BOM (Excel), séparateur « ; » (Excel FR), fins de ligne CRLF. */
export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return BOM + rows.map((r) => r.map(csvCell).join(SEP)).join("\r\n") + "\r\n";
}

export const CSV_HEADER = [
  "Référence",
  "Statut",
  "Date",
  "Début",
  "Fin",
  "Spa",
  "Client",
  "Téléphone",
  "Soins",
  "Praticiens",
  "Salles",
  "Acompte (FCFA)",
  "Acompte reçu",
  "Données",
];

export interface CsvContext {
  siteName: string;
  services: Service[];
  staff: Practitioner[];
  rooms: Room[];
}

export function reservationsToCsv(reservations: Reservation[], ctx: CsvContext): string {
  const name = <T extends { id: string; name: string }>(list: T[], id: string) => list.find((x) => x.id === id)?.name ?? id;
  const rows = reservations.map((r) => [
    r.reference,
    STATUS_LABELS[r.status],
    r.date,
    r.lines[0]?.start ?? "",
    r.lines.length ? reservationEnd(r.lines) : endTime("00:00", 0),
    ctx.siteName,
    r.customerName,
    r.customerPhone,
    r.lines.map((l) => name(ctx.services, l.serviceId)).join(" + "),
    r.lines.map((l) => name(ctx.staff, l.practitionerId)).join(" + "),
    r.lines.map((l) => name(ctx.rooms, l.roomId)).join(" + "),
    r.depositAmount,
    isDepositReceived(r.status) ? "oui" : "non",
    r.fictive ? "FICTIF (démo)" : "démo",
  ]);
  return toCsv([CSV_HEADER, ...rows]);
}
