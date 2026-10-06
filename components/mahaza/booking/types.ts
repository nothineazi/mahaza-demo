import type { Wanted } from "@/lib/mahaza/scheduling";

export type StepKey = "site" | "services" | "practitioners" | "slot" | "deposit" | "confirmation";

export const STEP_LABELS: Record<StepKey, string> = {
  site: "Spa",
  services: "Soins",
  practitioners: "Praticien",
  slot: "Créneau",
  deposit: "Acompte",
  confirmation: "Confirmation",
};

export const STEP_TITLES: Record<StepKey, string> = {
  site: "Choisissez votre spa",
  services: "Composez votre moment",
  practitioners: "Votre praticien",
  slot: "Choisissez votre créneau",
  deposit: "Acompte & coordonnées",
  confirmation: "Votre réservation",
};

export interface Draft {
  siteId: string | null;
  /** Soins du panier, dans l'ordre d'ajout (= ordre d'enchaînement). */
  cart: string[];
  /** Praticien choisi par soin ; absent ou null = « sans préférence ». */
  choice: Record<string, string | null>;
  date: string | null;
  /** HH:mm */
  time: string | null;
  name: string;
  phone: string;
  reservationId: string | null;
  /** Annulation volontaire (sinon une annulation sans action = expiration de l'acompte). */
  userCancelled: boolean;
}

export const emptyDraft = (siteId: string | null): Draft => ({
  siteId,
  cart: [],
  choice: {},
  date: null,
  time: null,
  name: "",
  phone: "",
  reservationId: null,
  userCancelled: false,
});

export const wantedFromDraft = (draft: Pick<Draft, "cart" | "choice">): Wanted[] =>
  draft.cart.map((serviceId) => ({ serviceId, practitionerId: draft.choice[serviceId] ?? null }));
