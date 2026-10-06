import type { Booking } from "@/data/types";

export interface Draft {
  siteId: string | null;
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
  siteId: null,
  serviceId: null,
  practitionerId: null,
  roomId: null,
  date: null,
  time: null,
  name: "",
  phone: "",
  booking: null,
};

export type StepKey = "site" | "service" | "practitioner" | "slot" | "deposit" | "confirmation";

export const STEP_LABELS: Record<StepKey, string> = {
  site: "Spa",
  service: "Service",
  practitioner: "Praticien",
  slot: "Créneau",
  deposit: "Acompte",
  confirmation: "Confirmation",
};

export const STEP_TITLES: Record<StepKey, string> = {
  site: "Choisissez votre spa",
  service: "Choisissez votre service",
  practitioner: "Choisissez votre praticien",
  slot: "Choisissez votre créneau",
  deposit: "Acompte & coordonnées",
  confirmation: "Votre réservation",
};
