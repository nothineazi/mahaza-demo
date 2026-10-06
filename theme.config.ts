import type { ThemeConfig } from "@/data/types";
import {
  mahazaCategories,
  mahazaPractitioners,
  mahazaPremium,
  mahazaRooms,
  mahazaSeedBookings,
  mahazaServices,
  mahazaSites,
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
 * via NEXT_PUBLIC_THEME ("mahaza" | "stlouis"). Les numéros MoMo / WhatsApp
 * ci-dessous sont des PLACEHOLDERS à remplacer avant toute mise en production.
 */

const mahaza: ThemeConfig = {
  id: "mahaza",
  name: "Mahaza Beauty",
  tagline: "Spa & institut de beauté",
  description: "Un voyage sensoriel au cœur du bien-être : soins du visage et du corps, hammam, beauté des mains et des pieds, coiffure. Réservez dans l'un de nos 5 spas.",
  logoText: "Mahaza", // repli texte ; le vrai logo est `logo` ci-dessous
  logo: { src: "/mahaza/logo.png", width: 151, height: 51, alt: "Mahaza Beauty" }, // taille native : ne pas agrandir
  icon: { src: "/mahaza/app-icon.png", type: "image/png" },
  city: "Douala · Yaoundé",
  // Champ de repli : l'adresse affichée est celle de chaque site (`sites`).
  address: "Adresse à confirmer",
  hoursLabel: "Lun – Ven · 8h30 – 20h00 | Sam · 10h00 – 20h00 | Dim · 11h00 – 20h00",
  // Horaires du site actuel, affichés pour tous les sites. À CONFIRMER PAR SITE.
  schedule: [
    { label: "Lundi – vendredi", days: [1, 2, 3, 4, 5], open: "08:30", close: "20:00" },
    { label: "Samedi", days: [6], open: "10:00", close: "20:00" },
    { label: "Dimanche", days: [0], open: "11:00", close: "20:00" },
  ],
  hoursToConfirm: true,
  contactEmail: "welcome@mahazabeauty.com",
  socials: [
    { network: "facebook", label: "Facebook", url: "https://www.facebook.com/mahazabeauty" },
    { network: "instagram", label: "Instagram", url: "https://www.instagram.com/mahazabeauty" },
    { network: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@mahazabeauty" },
    { network: "twitter", label: "Twitter", url: "https://twitter.com/mahazabeauty" },
    { network: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/mahazabeauty" },
  ],
  // Palette dérivée du logo (or #E9B93C, gris charbon) et des visuels (fleur saumon #DE968D, serviette ocre, crème).
  // Tous les couples texte/fond ≥ 4,5:1 (WCAG AA) — voir le tableau de contrastes du README.
  colors: {
    background: "#FFFBF4",
    foreground: "#2E2A2B",
    card: "#FFFFFF",
    primary: "#7A5806", // or bronze (or du logo assombri pour le texte)
    primaryForeground: "#FFFFFF",
    secondary: "#F8EFD8",
    secondaryForeground: "#4A3604",
    muted: "#F4EEE6",
    mutedForeground: "#645D5E", // gris du logo assombri
    accent: "#E9B93C", // or du logo (décoratif, texte foncé dessus)
    accentForeground: "#2B2105",
    border: "#E8DCC8",
    success: "#17703F",
    destructive: "#B42323",
  },
  // Titres : police d'affichage serif (Cormorant Garamond, via next/font : variable --font-display),
  // avec repli Georgia si la police n'est pas chargée. Texte courant : police système.
  fonts: {
    heading: 'var(--font-display), Georgia, "Times New Roman", serif',
    body: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  radius: "0.9rem",
  opening: {
    open: "08:30",
    close: "20:00",
    closedDays: [],
    slotStepMin: 30,
    byDay: { 6: { open: "10:00", close: "20:00" }, 0: { open: "11:00", close: "20:00" } },
  },
  sites: mahazaSites,
  categories: mahazaCategories,
  services: mahazaServices,
  practitioners: mahazaPractitioners,
  rooms: mahazaRooms,
  seedBookings: mahazaSeedBookings,
  premium: mahazaPremium,
  defaultDurationMin: 60, // FICTIF : durées réelles inconnues
  // Acompte : forfait FICTIF par site (voir `sites[].depositAmount`), pas de pourcentage.
  momo: { merchantNumber: "6 00 00 00 00", merchantName: "MAHAZA BEAUTY (placeholder)" },
  whatsappNumber: "237600000000",
  referencePrefix: "MAH",
  home: {
    heroKicker: "Un voyage sensoriel au cœur du bien-être",
    heroTitle: "Bienvenue à Mahaza Beauty",
    heroImages: [
      { src: "/mahaza/hero-1.png", width: 1290, height: 610, alt: "Soin des pieds au spa Mahaza : plateau de gommages et fleurs" },
      { src: "/mahaza/hero-2.png", width: 1290, height: 610, alt: "Soin du visage au spa Mahaza" },
    ],
    about: {
      title: "La magie du bien-être",
      text: "Hammam, soins du visage et du corps, beauté des mains et des pieds, épilation, regard, coiffure : des soins pour femme, homme et enfant, dans nos 5 spas à Douala et Yaoundé.",
      image: { src: "/mahaza/about.png", width: 500, height: 477, alt: "Pédicure spa chez Mahaza" },
    },
    featured: [
      { title: "Rituel endocrinien sensuel", description: "Hammam, gommage sensuel et masque à la fleur de rose." },
      { title: "Soin hydrafacial", description: "Nettoie en profondeur et purifie la peau pour un teint frais et éclatant." },
      { title: "Relaxation ultime", description: "Jacuzzi, massage relaxant et détente, soin de visage." },
      { title: "Manucure et pédicure spa", description: "Un soin luxueux pour des mains et des pieds doux et élégants." },
    ],
    process: [
      { title: "Diagnostic" },
      { title: "Soins", image: { src: "/mahaza/process-2.png", width: 200, height: 200, alt: "Soin du visage" } },
      { title: "Conseils & Suivi", image: { src: "/mahaza/process-3.png", width: 200, height: 200, alt: "Conseils et suivi après le soin" } },
    ],
    gift: {
      title: "Cartes cadeaux",
      text: "Offrez un moment de bien-être. Choisissez le montant de la carte cadeau.",
      image: { src: "/mahaza/gift.png", width: 500, height: 250, alt: "Carte cadeau avec ruban rouge" },
      // Paliers : de 20 000 à 100 000 FCFA (pas exact à confirmer par Mahaza).
      amounts: [20000, 40000, 60000, 80000, 100000],
    },
    decorImage: { src: "/mahaza/flower.png", width: 193, height: 158 },
  },
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
