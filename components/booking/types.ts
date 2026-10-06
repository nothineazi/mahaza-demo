import type { Booking } from "@/data/types";

export interface Draft {
  serviceId: string | null;
  practitionerId: string | null;
  roomId: string | null;
  date: string | null;
  time: string | null;
  name: string;
  phone: string;
  booking: Booking | null;
}

export const emptyDraft: Draft = {
  serviceId: null,
  practitionerId: null,
  roomId: null,
  date: null,
  time: null,
  name: "",
  phone: "",
  booking: null,
};

export const STEPS = ["Service", "Praticien", "Créneau", "Acompte", "Confirmation"] as const;
