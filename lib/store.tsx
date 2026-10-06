"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { theme } from "@/theme.config";
import type { Booking, Practitioner, Room, SeedBooking } from "@/data/types";
import { addDays, mondayOf, todayISO } from "./dates";
import { depositFor } from "./availability";

export type NewBooking = Omit<Booking, "id" | "reference" | "depositReceived">;

interface Store {
  /** false tant que la date du jour n'est pas connue (évite un décalage serveur/client). */
  ready: boolean;
  today: string;
  bookings: Booking[];
  rooms: Room[];
  staff: Practitioner[];
  /** Référence qui sera attribuée à la prochaine réservation (affichée dans les instructions MoMo). */
  nextReference: string;
  addBooking: (b: NewBooking) => Booking;
  setDepositReceived: (id: string, received: boolean) => void;
  saveRoom: (room: Room) => void;
  removeRoom: (id: string) => void;
  saveStaff: (member: Practitioner) => void;
  removeStaff: (id: string) => void;
  newId: (prefix: string) => string;
}

const StoreContext = createContext<Store | null>(null);

function seedToBookings(seed: SeedBooking[], today: string): Booking[] {
  const monday = mondayOf(today);
  return seed.flatMap((s) => {
    const service = theme.services.find((x) => x.id === s.serviceId);
    if (!service) return [];
    return [
      {
        id: s.id,
        reference: `${theme.referencePrefix}-${s.id.replace("b", "").padStart(4, "0")}`,
        serviceId: s.serviceId,
        practitionerId: s.practitionerId,
        roomId: s.roomId,
        date: addDays(monday, s.dayOffset),
        start: s.start,
        durationMin: service.durationMin,
        price: service.price,
        customerName: s.customerName,
        customerPhone: s.customerPhone,
        depositAmount: depositFor(service.price, theme.depositPercent),
        depositReceived: s.depositReceived,
      },
    ];
  });
}

/**
 * État de la démo : tout vit en mémoire (React state). Un rechargement de page
 * remet les seed data d'origine — rien n'est envoyé ni stocké nulle part.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>(theme.rooms);
  const [staff, setStaff] = useState<Practitioner[]>(theme.practitioners);
  const counter = useRef(0);

  useEffect(() => {
    const t = todayISO();
    setToday(t);
    setBookings(seedToBookings(theme.seedBookings, t));
  }, []);

  const newId = useCallback((prefix: string) => `${prefix}${Date.now().toString(36)}${++counter.current}`, []);

  const nextReference = `${theme.referencePrefix}-${1000 + bookings.length + 1}`;

  const addBooking = useCallback(
    (b: NewBooking): Booking => {
      const booking: Booking = {
        ...b,
        id: `b${Date.now().toString(36)}${bookings.length + 1}`,
        reference: nextReference,
        depositReceived: false,
      };
      setBookings((prev) => [...prev, booking]);
      return booking;
    },
    [bookings.length, nextReference],
  );

  const value = useMemo<Store>(
    () => ({
      ready: today !== "",
      today,
      bookings,
      rooms,
      staff,
      nextReference,
      addBooking,
      newId,
      setDepositReceived: (id, received) =>
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, depositReceived: received } : b))),
      saveRoom: (room) =>
        setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev.map((r) => (r.id === room.id ? room : r)) : [...prev, room])),
      removeRoom: (id) => setRooms((prev) => prev.filter((r) => r.id !== id)),
      saveStaff: (member) =>
        setStaff((prev) => (prev.some((p) => p.id === member.id) ? prev.map((p) => (p.id === member.id ? member : p)) : [...prev, member])),
      removeStaff: (id) => setStaff((prev) => prev.filter((p) => p.id !== id)),
    }),
    [today, bookings, rooms, staff, nextReference, addBooking, newId],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé dans <StoreProvider>");
  return ctx;
}
