import type { ThemeConfig } from "@/data/types";
import {
  mahazaCategories,
  mahazaPractitioners,
  mahazaRooms,
  mahazaSeedBookings,
  mahazaServices,
} from "@/data/mahaza";
import {
  stlouisCategories,
  stlouisPractitioners,
  stlouisRooms,
  stlouisSeedBookings,
  stlouisServices,
} from "@/data/stlouis";

/**
 * Configuration des deux marques. La marque active est choisie au build
 * via NEXT_PUBLIC_THEME ("mahaza" | "stlouis"). Tous les numéros et couleurs
 * ci-dessous sont des PLACEHOLDERS à remplacer avant toute mise en production.
 */

const mahaza: ThemeConfig = {
  id: "mahaza",
  name: "Mahaza",
  tagline: "Institut de beauté",
  description: "Soins du visage, ongles, coiffure et bien-être à Douala. Réservez votre moment en quelques clics.",
  logoText: "Mahaza", // placeholder : remplacer par le logo
  city: "Douala",
  address: "Bonapriso, Douala (adresse fictive)",
  hoursLabel: "Lun – Sam · 9h – 19h",
  colors: {
    background: "#FFFAFB",
    foreground: "#3A2430",
    card: "#FFFFFF",
    primary: "#9A3F66",
    primaryForeground: "#FFFFFF",
    secondary: "#F9E9EF",
    secondaryForeground: "#6B2A47",
    muted: "#F5EEF0",
    mutedForeground: "#7A6670",
    accent: "#C9A24B",
    accentForeground: "#2E2410",
    border: "#EBD9E0",
    success: "#16804A",
    destructive: "#C03030",
  },
  fonts: {
    heading: 'Georgia, "Times New Roman", serif',
    body: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  radius: "0.9rem",
  opening: { open: "09:00", close: "19:00", closedDays: [0], slotStepMin: 30 },
  categories: mahazaCategories,
  services: mahazaServices,
  practitioners: mahazaPractitioners,
  rooms: mahazaRooms,
  seedBookings: mahazaSeedBookings,
  depositPercent: 30,
  momo: { merchantNumber: "6 00 00 00 00", merchantName: "MAHAZA BEAUTE (placeholder)" },
  whatsappNumber: "237600000000",
  referencePrefix: "MAH",
};

const stlouis: ThemeConfig = {
  id: "stlouis",
  name: "St Louis",
  tagline: "Barbershop",
  description: "Coupes, dégradés et rasage à l'ancienne à Douala. Choisissez votre barbier et réservez votre fauteuil.",
  logoText: "ST LOUIS", // placeholder : remplacer par le logo
  city: "Douala",
  address: "Akwa, Douala (adresse fictive)",
  hoursLabel: "Tous les jours · 9h – 20h",
  colors: {
    background: "#121110",
    foreground: "#F3EEE4",
    card: "#1C1A18",
    primary: "#D4A747",
    primaryForeground: "#17120A",
    secondary: "#2A2622",
    secondaryForeground: "#F3EEE4",
    muted: "#24211E",
    mutedForeground: "#A9A094",
    accent: "#B5472F",
    accentForeground: "#FFF4EF",
    border: "#38332D",
    success: "#4CC38A",
    destructive: "#EF6B5B",
  },
  fonts: {
    heading: 'Impact, "Arial Narrow Bold", "Helvetica Neue", Arial, sans-serif',
    body: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  radius: "0.25rem",
  opening: { open: "09:00", close: "20:00", closedDays: [], slotStepMin: 30 },
  categories: stlouisCategories,
  services: stlouisServices,
  practitioners: stlouisPractitioners,
  rooms: stlouisRooms,
  seedBookings: stlouisSeedBookings,
  depositPercent: 30,
  momo: { merchantNumber: "6 11 11 11 11", merchantName: "ST LOUIS BARBERSHOP (placeholder)" },
  whatsappNumber: "237611111111",
  referencePrefix: "STL",
};

const requested = process.env.NEXT_PUBLIC_THEME;
if (requested && requested !== "mahaza" && requested !== "stlouis") {
  throw new Error(`NEXT_PUBLIC_THEME invalide : "${requested}" (attendu : "mahaza" ou "stlouis").`);
}

export const theme: ThemeConfig = requested === "stlouis" ? stlouis : mahaza;
