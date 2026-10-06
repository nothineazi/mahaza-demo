export interface Service {
  id: string;
  name: string;
  /** Optionnelle : vide si le site d'origine n'en donne pas. */
  description?: string;
  category: string;
  /** Optionnelle : vide si inconnue (la démo applique alors `ThemeConfig.defaultDurationMin`). */
  durationMin?: number;
  /** Prix en FCFA (XAF). Optionnel : s'il est vide, l'UI n'affiche aucun prix. */
  price?: number;
}

/** Un spa / site physique. Les marques mono-site n'en déclarent pas (voir `ThemeConfig.sites`). */
export interface Site {
  id: string;
  name: string;
  /** Optionnelle : ville non confirmée pour certains sites. */
  city?: string;
  /** « Adresse à confirmer » tant que l'adresse réelle n'est pas connue. */
  address: string;
  /** Acompte forfaitaire en FCFA. FICTIF (placeholder de démo), configurable par site. */
  depositAmount?: number;
  /** Délai (minutes) avant annulation du créneau si l'acompte n'est pas reçu. FICTIF ; surcharge `PremiumConfig.depositHoldMin`. */
  depositHoldMin?: number;
}

export interface Practitioner {
  id: string;
  name: string;
  role: string;
  serviceIds: string[];
  active: boolean;
  /** Site auquel le praticien appartient (absent = site unique). */
  siteId?: string;
  /** Donnée de démo inventée : l'UI affiche le badge FICTIF. */
  fictive?: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  /** Catégories de services pouvant se dérouler dans cette salle. */
  categories: string[];
  active: boolean;
  siteId?: string;
  /** Donnée de démo inventée : l'UI affiche le badge FICTIF. */
  fictive?: boolean;
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
  siteId?: string;
}

export interface Booking {
  id: string;
  reference: string;
  siteId?: string;
  serviceId: string;
  practitionerId: string;
  roomId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  start: string;
  durationMin: number;
  /** Absent si le service n'a pas de prix. */
  price?: number;
  customerName: string;
  customerPhone: string;
  depositAmount: number;
  depositReceived: boolean;
}

// ---------------------------------------------------------------------------
// Thème Mahaza « premium » : réservations multi-soins, cycle de vie, clients.
// Types uniquement (effacés à la compilation) : le thème St Louis n'est pas concerné.
// ---------------------------------------------------------------------------

export type BookingStatus = "pending_deposit" | "confirmed" | "completed" | "cancelled" | "no_show";

/** Un soin d'une réservation. Les lignes d'une même réservation s'enchaînent sans interruption. */
export interface ReservationLine {
  serviceId: string;
  practitionerId: string;
  roomId: string;
  /** HH:mm */
  start: string;
  /** Durée du créneau : durée du service si connue, sinon durée par défaut FICTIVE. */
  durationMin: number;
  /** Le client n'avait pas de préférence : le praticien a été attribué automatiquement. */
  noPreference: boolean;
}

export interface Reservation {
  id: string;
  reference: string;
  siteId: string;
  clientId: string;
  customerName: string;
  customerPhone: string;
  /** YYYY-MM-DD */
  date: string;
  /** Epoch ms de création. */
  createdAt: number;
  /** Epoch ms d'expiration de l'acompte (créneau libéré ensuite), null si sans objet. */
  holdExpiresAt: number | null;
  status: BookingStatus;
  depositAmount: number;
  lines: ReservationLine[];
  /** Epoch ms d'ouverture du rappel WhatsApp J-1 (démo). */
  reminderSentAt?: number;
  source: "seed" | "web";
  /** Donnée de démo inventée. */
  fictive?: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  homeSiteId: string;
  notes: string;
  /** Points de fidélité bonus (FICTIF), en plus des visites terminées. */
  bonusPoints: number;
  /** Donnée de démo inventée. */
  fictive?: boolean;
}

export interface LoyaltyTier {
  label: string;
  minPoints: number;
}

/** Réglages du thème premium (Mahaza). Toutes les valeurs sont FICTIVES et configurables. */
export interface PremiumConfig {
  /** Délai d'expiration de l'acompte, en minutes (FICTIF). */
  depositHoldMin: number;
  /** Nombre maximal de soins dans une réservation. */
  maxCartItems: number;
  /** Délai long appliqué aux acomptes en attente des réservations seed (FICTIF), en minutes. */
  seedHoldMin: number;
  loyalty: { pointsPerVisit: number; tiers: LoyaltyTier[] };
  /** FICTIF : barème par catégorie, utilisé uniquement pour le CA estimé du back-office. */
  fictivePriceByCategory: Record<string, number>;
  giftCard: { minAmount: number; maxAmount: number; stepAmount: number; messageMax: number };
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

/** Horaires d'une plage de jours (0 = dimanche … 6 = samedi). */
export interface ScheduleRange {
  label: string;
  days: number[];
  open: string;
  close: string;
}

export interface SocialLink {
  network: "facebook" | "instagram" | "tiktok" | "twitter" | "linkedin";
  label: string;
  url: string;
}

export interface FeaturedCare {
  title: string;
  description: string;
}

/** Contenu éditorial de l'accueil (optionnel : sans lui, l'accueil historique est affiché). */
export interface HomeContent {
  heroKicker: string;
  heroTitle: string;
  heroImages: { src: string; width: number; height: number; alt: string }[];
  about: { title: string; text: string; image: { src: string; width: number; height: number; alt: string } };
  featured: FeaturedCare[];
  process: { title: string; image?: { src: string; width: number; height: number; alt: string } }[];
  gift: { title: string; text: string; image: { src: string; width: number; height: number; alt: string }; amounts: number[] };
  decorImage: { src: string; width: number; height: number };
}

export interface ThemeConfig {
  id: "mahaza" | "stlouis";
  name: string;
  tagline: string;
  description: string;
  /** Logo placeholder (texte) en attendant le vrai fichier. */
  logoText: string;
  /** Vrai logo (fichier local). Affiché à sa taille native ou plus petite, jamais agrandi. */
  logo?: { src: string; width: number; height: number; alt: string };
  /** Favicon / icône (fichier local) ; sinon /icon.svg généré. */
  icon?: { src: string; type: string };
  city: string;
  address: string;
  hoursLabel: string;
  /** Horaires détaillés (affichés tels quels) ; `hoursToConfirm` ajoute la mention « à confirmer par site ». */
  schedule?: ScheduleRange[];
  hoursToConfirm?: boolean;
  contactEmail?: string;
  socials?: SocialLink[];
  home?: HomeContent;
  /** Liste des spas. Absente ou à un seul élément : l'étape « choix du spa » n'apparaît pas. */
  sites?: Site[];
  /** Durée du créneau quand le service n'a pas de durée. FICTIF. */
  defaultDurationMin?: number;
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
    /** Surcharge par jour de semaine (0 = dimanche) ; `null` = fermé. Prioritaire sur open/close. */
    byDay?: Partial<Record<number, { open: string; close: string } | null>>;
  };
  categories: string[];
  services: Service[];
  practitioners: Practitioner[];
  rooms: Room[];
  seedBookings: SeedBooking[];
  /** Réglages premium (thème Mahaza uniquement). */
  premium?: PremiumConfig;
  /** Acompte en % du prix du service (ignoré si le site définit un acompte forfaitaire). */
  depositPercent?: number;
  momo: {
    /** PLACEHOLDER : numéro marchand fictif. */
    merchantNumber: string;
    merchantName: string;
  };
  /** PLACEHOLDER : format international sans « + » (wa.me). */
  whatsappNumber: string;
  referencePrefix: string;
}
