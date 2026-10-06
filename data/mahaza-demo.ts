import type { BookingStatus, Client } from "./types";
import { mahazaPractitioners, mahazaRooms, mahazaSeedBookings, mahazaServices, mahazaSites } from "./mahaza";

/**
 * Données de démonstration « premium » du thème Mahaza : clients et historique.
 * TOUT est FICTIF (noms, téléphones, notes, visites passées, statuts). Génération déterministe :
 * aucun hasard, le même jeu de données à chaque chargement.
 */

/** Réservation de démo : les horaires des lignes sont calculés au chargement (voir `lib/mahaza/seed.ts`). */
export interface DemoReservationSeed {
  id: string;
  siteId: string;
  clientId: string;
  /** Jours depuis le lundi de la semaine en cours (négatif = semaines passées). */
  dayOffset: number;
  start: string;
  lines: { serviceId: string; practitionerId: string; roomId: string }[];
  /** Statut imposé (historique) ; absent = dérivé de la date et de `depositReceived`. */
  status?: BookingStatus;
  depositReceived: boolean;
  /** Réservation de la semaine en cours (seed d'origine). */
  current: boolean;
}

const NOTES = [
  "Préfère les rendez-vous en fin de matinée.",
  "Peau sensible : éviter les produits parfumés.",
  "Aime la température du hammam plutôt douce.",
  "Vient souvent accompagnée de sa fille.",
  "",
  "Allergie au latex : le signaler au praticien.",
  "",
  "Souhaite être rappelée la veille par WhatsApp.",
];

const HISTORY_TIMES = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

const serviceById = new Map(mahazaServices.map((s) => [s.id, s]));
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

export const mahazaClients: Client[] = [];
export const mahazaDemoReservations: DemoReservationSeed[] = [];

// Durée par défaut des créneaux (60 min, FICTIVE) : alignée sur `theme.defaultDurationMin`.
const SLOT_MIN = 60;

interface Placed {
  siteId: string;
  practitionerId: string;
  roomId: string;
  dayOffset: number;
  from: number;
  to: number;
}
const placed: Placed[] = [];

const clash = (p: Omit<Placed, "siteId">, siteId: string) =>
  placed.some(
    (q) =>
      q.siteId === siteId &&
      q.dayOffset === p.dayOffset &&
      q.from < p.to &&
      p.from < q.to &&
      (q.practitionerId === p.practitionerId || q.roomId === p.roomId),
  );

// Les réservations de la semaine en cours (seed d'origine) occupent d'abord leurs créneaux.
for (const b of mahazaSeedBookings) {
  const from = toMin(b.start);
  placed.push({ siteId: b.siteId!, practitionerId: b.practitionerId, roomId: b.roomId, dayOffset: b.dayOffset, from, to: from + SLOT_MIN });
}

let visitCounter = 0;

mahazaSites.forEach((site) => {
  const siteSeeds = mahazaSeedBookings.filter((b) => b.siteId === site.id);
  const siteServices = mahazaServices.filter((s) => mahazaPractitioners.some((p) => p.siteId === site.id && p.serviceIds.includes(s.id)));

  siteSeeds.forEach((seed, j) => {
    const clientId = `c-${site.id}-${j + 1}`;
    mahazaClients.push({
      id: clientId,
      name: seed.customerName,
      phone: seed.customerPhone,
      homeSiteId: site.id,
      notes: NOTES[(j + site.id.length) % NOTES.length],
      bonusPoints: (j % 4) * 5,
      fictive: true,
    });

    // Réservation de la semaine en cours (seed d'origine).
    mahazaDemoReservations.push({
      id: seed.id,
      siteId: site.id,
      clientId,
      dayOffset: seed.dayOffset,
      start: seed.start,
      lines: [{ serviceId: seed.serviceId, practitionerId: seed.practitionerId, roomId: seed.roomId }],
      depositReceived: seed.depositReceived,
      current: true,
    });

    // Historique passé : 1 à 3 visites, quelques-unes avec deux soins.
    const visits = 1 + (j % 3);
    for (let k = 0; k < visits; k++) {
      const dayOffset = -7 * (k + 1) + ((j + k) % 5);
      const wanted = k % 2 === 0 ? [seed.serviceId] : [siteServices[(j * 5 + k * 3) % siteServices.length].id];
      if (j % 4 === 0 && k === 0) wanted.push(siteServices[(j * 7 + 2) % siteServices.length].id);

      for (let t = 0; t < HISTORY_TIMES.length; t++) {
        const startMin = toMin(HISTORY_TIMES[(j * 2 + k + t) % HISTORY_TIMES.length]);
        const lines: { serviceId: string; practitionerId: string; roomId: string }[] = [];
        const tentative: Placed[] = [];
        let ok = true;
        wanted.forEach((serviceId, idx) => {
          if (!ok) return;
          const from = startMin + idx * SLOT_MIN;
          // Les lignes d'une même visite sont comptées comme occupées pendant la recherche.
          const line = findLine(site.id, serviceId, dayOffset, from, tentative);
          if (!line) {
            ok = false;
            return;
          }
          lines.push(line);
          tentative.push({ siteId: site.id, practitionerId: line.practitionerId, roomId: line.roomId, dayOffset, from, to: from + SLOT_MIN });
        });
        if (!ok || lines.length !== wanted.length) continue;
        placed.push(...tentative);
        const n = (j + k) % 11;
        const status: BookingStatus = n === 3 || n === 8 ? "no_show" : n === 5 ? "cancelled" : "completed";
        visitCounter += 1;
        mahazaDemoReservations.push({
          id: `h-${site.id}-${visitCounter}`,
          siteId: site.id,
          clientId,
          dayOffset,
          start: HISTORY_TIMES[(j * 2 + k + t) % HISTORY_TIMES.length],
          lines,
          status,
          depositReceived: status !== "cancelled",
          current: false,
        });
        break;
      }
    }
  });
});

/** Cherche, pour un soin, un praticien et une salle libres à l'heure demandée. */
function findLine(siteId: string, serviceId: string, dayOffset: number, from: number, extra: Placed[]) {
  const service = serviceById.get(serviceId);
  if (!service) return null;
  const pract = mahazaPractitioners.filter((p) => p.siteId === siteId && p.serviceIds.includes(serviceId));
  const rooms = mahazaRooms.filter((r) => r.siteId === siteId && r.categories.includes(service.category));
  for (const p of pract) {
    for (const r of rooms) {
      const cand = { practitionerId: p.id, roomId: r.id, dayOffset, from, to: from + SLOT_MIN };
      const clashExtra = extra.some((q) => q.dayOffset === dayOffset && q.from < cand.to && cand.from < q.to && (q.practitionerId === p.id || q.roomId === r.id));
      if (!clash(cand, siteId) && !clashExtra) return { serviceId, practitionerId: p.id, roomId: r.id };
    }
  }
  return null;
}
