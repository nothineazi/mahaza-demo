export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMin: number;
  /** Prix en FCFA (XAF). */
  price: number;
}

export interface Practitioner {
  id: string;
  name: string;
  role: string;
  serviceIds: string[];
  active: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  /** Catégories de services pouvant se dérouler dans cette salle. */
  categories: string[];
  active: boolean;
}

/** Réservation seed : la date est exprimée en jours depuis le lundi de la semaine en cours. */
export interface SeedBooking {
  id: string;
  serviceId: string;
  practitionerId: string;
  roomId: string;
  dayOffset: number;
  start: string;
  customerName: string;
  customerPhone: string;
  depositReceived: boolean;
}

export interface Booking {
  id: string;
  reference: string;
  serviceId: string;
  practitionerId: string;
  roomId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  start: string;
  durationMin: number;
  price: number;
  customerName: string;
  customerPhone: string;
  depositAmount: number;
  depositReceived: boolean;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  success: string;
  destructive: string;
}

export interface ThemeConfig {
  id: "mahaza" | "stlouis";
  name: string;
  tagline: string;
  description: string;
  /** Logo placeholder (texte) en attendant le vrai fichier. */
  logoText: string;
  city: string;
  address: string;
  hoursLabel: string;
  colors: ThemeColors;
  fonts: { heading: string; body: string };
  /** Rayon des coins (css), pour différencier les deux marques. */
  radius: string;
  opening: {
    open: string;
    close: string;
    /** 0 = dimanche … 6 = samedi */
    closedDays: number[];
    slotStepMin: number;
  };
  categories: string[];
  services: Service[];
  practitioners: Practitioner[];
  rooms: Room[];
  seedBookings: SeedBooking[];
  /** Acompte demandé, en % du prix du service. */
  depositPercent: number;
  momo: {
    /** PLACEHOLDER : numéro marchand fictif. */
    merchantNumber: string;
    merchantName: string;
  };
  /** PLACEHOLDER : format international sans « + » (wa.me). */
  whatsappNumber: string;
  referencePrefix: string;
}
