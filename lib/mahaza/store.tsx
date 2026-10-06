"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { theme } from "@/theme.config";
import { mahazaClients, mahazaDemoReservations } from "@/data/mahaza-demo";
import type { BookingStatus, Client, Practitioner, Reservation, ReservationLine, Room } from "@/data/types";
import { nowMinutes, todayISO } from "@/lib/dates";
import { belongsToSite, firstSiteId, getSite } from "@/lib/sites";
import { depositForService } from "@/lib/availability";
import { findConflicts, hasBlocking, buildMovedLines, type Conflict, type MoveInput } from "./conflicts";
import { expiredHoldIds, holdExpiresAt, holdMinutesFor } from "./holds";
import { checkTransition, reoccupiesSlot } from "./lifecycle";
import { phoneKey } from "./phone";
import { planLines, FAILURE_LABELS, type PlanContext, type Wanted } from "./scheduling";
import { buildSeedReservations } from "./seed";

const premium = theme.premium!;

export type Result<T = void> = { ok: true; value: T } | { ok: false; reason: string; conflicts?: Conflict[] };
const fail = (reason: string, conflicts?: Conflict[]): { ok: false; reason: string; conflicts?: Conflict[] } => ({ ok: false, reason, conflicts });

export interface GiftCard {
  id: string;
  code: string;
  amount: number;
  from: string;
  to: string;
  message: string;
  createdAt: number;
}

export interface NewReservation {
  siteId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  lines: ReservationLine[];
}

interface Store {
  /** false tant que la date du jour n'est pas connue (évite un décalage serveur / client). */
  ready: boolean;
  today: string;
  reservations: Reservation[];
  clients: Client[];
  rooms: Room[];
  staff: Practitioner[];
  giftCards: GiftCard[];
  adminSiteId: string;
  setAdminSiteId: (id: string) => void;
  /** Fiche client à ouvrir en arrivant sur /admin/clients. */
  focusClientId: string | null;
  setFocusClientId: (id: string | null) => void;
  /** Référence qui sera attribuée à la prochaine réservation web (instructions MoMo). */
  nextReference: string;
  /** Contexte d'ordonnancement d'un spa (horloge lue à l'appel). */
  planContext: (siteId: string) => PlanContext;
  createReservation: (input: NewReservation) => Result<Reservation>;
  setStatus: (id: string, to: BookingStatus) => Result;
  moveReservation: (id: string, input: MoveInput) => Result;
  /** Modification côté client : nouveau jour / heure, soins et préférences conservés. */
  rescheduleReservation: (id: string, date: string, startMin: number) => Result;
  markReminderSent: (id: string) => void;
  saveClientNotes: (clientId: string, notes: string) => void;
  addGiftCard: (card: Omit<GiftCard, "id" | "createdAt">) => GiftCard;
  saveRoom: (room: Room) => void;
  removeRoom: (id: string) => void;
  saveStaff: (member: Practitioner) => void;
  removeStaff: (id: string) => void;
  newId: (prefix: string) => string;
}

const StoreContext = createContext<Store | null>(null);

const wantedOf = (lines: ReservationLine[]): Wanted[] =>
  lines.map((l) => ({ serviceId: l.serviceId, practitionerId: l.noPreference ? null : l.practitionerId }));

/**
 * État de la démo Mahaza : tout vit en mémoire (React state). Un rechargement remet les données seed
 * d'origine — rien n'est envoyé ni stocké nulle part.
 */
export function MahazaStoreProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clients, setClients] = useState<Client[]>(mahazaClients);
  const [rooms, setRooms] = useState<Room[]>(theme.rooms);
  const [staff, setStaff] = useState<Practitioner[]>(theme.practitioners);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [adminSiteId, setAdminSiteId] = useState(firstSiteId);
  const [focusClientId, setFocusClientId] = useState<string | null>(null);
  const counter = useRef(0);
  // Copie lisible de l'état pour les actions (évite des fermetures périmées dans les gestionnaires).
  const latest = useRef({ reservations, clients, rooms, staff });
  latest.current = { reservations, clients, rooms, staff };

  useEffect(() => {
    const t = todayISO();
    setToday(t);
    setReservations(
      buildSeedReservations(
        {
          demo: mahazaDemoReservations,
          services: theme.services,
          defaultDurationMin: theme.defaultDurationMin ?? 60,
          referencePrefix: theme.referencePrefix,
          depositFor: (siteId) => depositForService({}, getSite(siteId)),
          today: t,
          nowMs: Date.now(),
          seedHoldMin: premium.seedHoldMin,
        },
        mahazaClients,
      ),
    );
  }, []);

  // Expiration des acomptes : un seul minuteur léger, sans mise à jour d'état tant que rien n'expire.
  useEffect(() => {
    const timer = setInterval(() => {
      setReservations((prev) => {
        const ids = expiredHoldIds(prev, Date.now());
        if (ids.length === 0) return prev;
        return prev.map((r) => (ids.includes(r.id) ? { ...r, status: "cancelled" as const, holdExpiresAt: null } : r));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const newId = useCallback((prefix: string) => `${prefix}${Date.now().toString(36)}${++counter.current}`, []);

  const webCount = reservations.filter((r) => r.source === "web").length;
  const nextReference = `${theme.referencePrefix}-${1000 + webCount + 1}`;

  const planContext = useCallback(
    (siteId: string): PlanContext => {
      const s = latest.current;
      return {
        siteId,
        services: theme.services,
        staff: s.staff,
        rooms: s.rooms,
        reservations: s.reservations,
        opening: theme.opening,
        defaultDurationMin: theme.defaultDurationMin ?? 60,
        today: todayISO(),
        nowMin: nowMinutes(),
      };
    },
    [],
  );

  const createReservation = useCallback(
    (input: NewReservation): Result<Reservation> => {
      if (input.lines.length === 0) return fail("Aucun soin dans la réservation.");
      const ctx = planContext(input.siteId);
      const conflicts = findConflicts(ctx, input.date, input.lines);
      if (hasBlocking(conflicts)) return fail("Ce créneau n'est plus disponible.", conflicts);

      const site = getSite(input.siteId);
      const key = phoneKey(input.customerPhone);
      const existing = latest.current.clients.find((c) => phoneKey(c.phone) === key && c.homeSiteId === input.siteId);
      const client: Client = existing ?? {
        id: `c-web-${Date.now().toString(36)}${++counter.current}`,
        name: input.customerName,
        phone: input.customerPhone,
        homeSiteId: input.siteId,
        notes: "",
        bonusPoints: 0,
      };
      const now = Date.now();
      const webSeq = latest.current.reservations.filter((r) => r.source === "web").length + 1;
      const reservation: Reservation = {
        id: `w-${now.toString(36)}-${webSeq}`,
        reference: `${theme.referencePrefix}-${1000 + webSeq}`,
        siteId: input.siteId,
        clientId: client.id,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        date: input.date,
        createdAt: now,
        holdExpiresAt: holdExpiresAt(now, holdMinutesFor(site, premium)),
        status: "pending_deposit",
        depositAmount: depositForService({}, site, theme.depositPercent),
        lines: input.lines,
        source: "web",
      };
      if (!existing) setClients((prev) => [...prev, client]);
      setReservations((prev) => [...prev, reservation]);
      return { ok: true, value: reservation };
    },
    [planContext],
  );

  const setStatus = useCallback(
    (id: string, to: BookingStatus): Result => {
      const r = latest.current.reservations.find((x) => x.id === id);
      if (!r) return fail("Réservation introuvable.");
      const check = checkTransition(r, to, todayISO());
      if (!check.ok) return fail(check.reason);
      if (reoccupiesSlot(r.status, to)) {
        const conflicts = findConflicts(planContext(r.siteId), r.date, r.lines, r.id);
        if (hasBlocking(conflicts)) return fail("Le créneau n'est plus libre : déplacez d'abord la réservation.", conflicts);
      }
      const hold = to === "pending_deposit" ? holdExpiresAt(Date.now(), holdMinutesFor(getSite(r.siteId), premium)) : null;
      setReservations((prev) => prev.map((x) => (x.id === id ? { ...x, status: to, holdExpiresAt: hold } : x)));
      return { ok: true, value: undefined };
    },
    [planContext],
  );

  const moveReservation = useCallback(
    (id: string, input: MoveInput): Result => {
      const r = latest.current.reservations.find((x) => x.id === id);
      if (!r) return fail("Réservation introuvable.");
      const lines = buildMovedLines(r.lines, input);
      const conflicts = findConflicts(planContext(r.siteId), input.date, lines, r.id);
      if (hasBlocking(conflicts)) return fail("Déplacement impossible : conflit.", conflicts);
      setReservations((prev) => prev.map((x) => (x.id === id ? { ...x, date: input.date, lines } : x)));
      return { ok: true, value: undefined };
    },
    [planContext],
  );

  const rescheduleReservation = useCallback(
    (id: string, date: string, startMin: number): Result => {
      const r = latest.current.reservations.find((x) => x.id === id);
      if (!r) return fail("Réservation introuvable.");
      const plan = planLines(planContext(r.siteId), date, startMin, wantedOf(r.lines), r.id);
      if (!plan.ok) return fail(FAILURE_LABELS[plan.reason]);
      setReservations((prev) => prev.map((x) => (x.id === id ? { ...x, date, lines: plan.lines } : x)));
      return { ok: true, value: undefined };
    },
    [planContext],
  );

  const value = useMemo<Store>(
    () => ({
      ready: today !== "",
      today,
      reservations,
      clients,
      rooms,
      staff,
      giftCards,
      adminSiteId,
      setAdminSiteId,
      focusClientId,
      setFocusClientId,
      nextReference,
      planContext,
      createReservation,
      setStatus,
      moveReservation,
      rescheduleReservation,
      markReminderSent: (id) => setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, reminderSentAt: Date.now() } : r))),
      saveClientNotes: (clientId, notes) => setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, notes } : c))),
      addGiftCard: (card) => {
        const full: GiftCard = { ...card, id: `g${Date.now().toString(36)}${++counter.current}`, createdAt: Date.now() };
        setGiftCards((prev) => [...prev, full]);
        return full;
      },
      saveRoom: (room) => setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev.map((r) => (r.id === room.id ? room : r)) : [...prev, room])),
      removeRoom: (id) => setRooms((prev) => prev.filter((r) => r.id !== id)),
      saveStaff: (member) => setStaff((prev) => (prev.some((p) => p.id === member.id) ? prev.map((p) => (p.id === member.id ? member : p)) : [...prev, member])),
      removeStaff: (id) => setStaff((prev) => prev.filter((p) => p.id !== id)),
      newId,
    }),
    [today, reservations, clients, rooms, staff, giftCards, adminSiteId, focusClientId, nextReference, planContext, createReservation, setStatus, moveReservation, rescheduleReservation, newId],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useMahazaStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useMahazaStore doit être utilisé dans <MahazaStoreProvider>");
  return ctx;
}

/** Données du spa sélectionné dans le back-office, filtrées par spa. */
export function useAdminData() {
  const store = useMahazaStore();
  const { adminSiteId, reservations, clients, rooms, staff } = store;
  return useMemo(
    () => ({
      ...store,
      siteId: adminSiteId,
      site: getSite(adminSiteId),
      reservations: reservations.filter((r) => r.siteId === adminSiteId),
      clients: clients.filter((c) => c.homeSiteId === adminSiteId),
      rooms: rooms.filter((r) => belongsToSite(r, adminSiteId)),
      staff: staff.filter((p) => belongsToSite(p, adminSiteId)),
    }),
    [store, adminSiteId, reservations, clients, rooms, staff],
  );
}
