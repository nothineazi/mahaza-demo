import type { Practitioner, Room, SeedBooking, Service, Site } from "./types";

/**
 * Données Mahaza Beauty.
 *
 * RÉEL (issu du site actuel de Mahaza Beauty) : noms des 5 sites, catégories et noms des services.
 * FICTIF (inventé pour la démo) : acompte forfaitaire, durée par défaut des créneaux, praticiens,
 * salles et réservations seed. Chaque entrée fictive porte `fictive: true` (badge « FICTIF » dans l'UI).
 * Aucun prix de soin n'est renseigné : le site actuel n'en affiche pas (champ `price` volontairement vide).
 */

// ---------------------------------------------------------------------------
// Sites (RÉEL pour les noms ; adresses inconnues)
// ---------------------------------------------------------------------------

/** FICTIF : acompte forfaitaire de démo, en FCFA, configurable par site. */
const FICTIVE_DEPOSIT_FCFA = 5000;

const ADDRESS_TBC = "Adresse à confirmer";

export const mahazaSites: Site[] = [
  { id: "douala-bonapriso", name: "Douala Bonapriso", city: "Douala", address: ADDRESS_TBC, depositAmount: FICTIVE_DEPOSIT_FCFA },
  { id: "douala-yassa", name: "Douala Yassa", city: "Douala", address: ADDRESS_TBC, depositAmount: FICTIVE_DEPOSIT_FCFA },
  { id: "yaounde-bastos", name: "Yaoundé Bastos", city: "Yaoundé", address: ADDRESS_TBC, depositAmount: FICTIVE_DEPOSIT_FCFA },
  { id: "yaounde-dragage", name: "Yaoundé Dragage", city: "Yaoundé", address: ADDRESS_TBC, depositAmount: FICTIVE_DEPOSIT_FCFA },
  // Ville non indiquée sur le site actuel : volontairement non renseignée.
  { id: "best-western-airport", name: "Best Western Airport", address: ADDRESS_TBC, depositAmount: FICTIVE_DEPOSIT_FCFA },
];

// ---------------------------------------------------------------------------
// Catalogue de services (RÉEL) — pas de prix, pas de durée, pas de description
// ---------------------------------------------------------------------------

const CATALOG = [
  {
    key: "mp",
    category: "Beauté des mains et des pieds",
    services: ["Pose de vernis simple", "Pose de vernis Gel", "Gainage", "Remplissage Gel", "Pose de gel", "Manucure spa", "Pédicure spa"],
  },
  {
    key: "vi",
    category: "Soin de visage",
    services: ["Soin éclat", "Soin classique", "Soin acnéique", "Soin anti-âge", "Microneedling", "Hydrafacial", "Peeling du visage"],
  },
  {
    key: "co",
    category: "Soin du corps",
    services: ["Hammam/Gommage", "Sauna", "Jacuzzi", "Couverture chauffante", "Rituel endocrinien", "Massage relaxant et détente", "Soin anti-vergeture"],
  },
  {
    key: "ep",
    category: "Épilation",
    services: ["Vajacial", "Maillot", "Jambe et demi-jambes", "Aisselles", "Bras", "Menton", "Sourcils"],
  },
  {
    key: "re",
    category: "Beauté du regard",
    services: ["Extension de cils", "Remplissage de cils", "Microblading", "Microshading", "Make-up marié", "Make-up jour", "Make-up soir"],
  },
  {
    key: "cf",
    category: "Coiffure femme",
    services: ["Soin capillaire", "Coloration", "Lissage brésilien", "Pose frontale", "Coiffure africaine", "Tissage", "Brushing"],
  },
  {
    key: "ho",
    category: "Soin pour homme",
    services: ["Coiffure", "Soin de visage", "Soin de corps", "Pédicure", "Manucure", "Massage relaxant"],
  },
  {
    key: "en",
    category: "Soin pour enfant (garçon et fille)",
    services: ["Coiffure garçon", "Coiffure fille", "Soin de visage jeunesse", "Manucure", "Pédicure", "Massage relaxant"],
  },
] as const;

const slug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Identifiant stable d'un service : `<clé catégorie>-<nom slugifié>`. */
const sid = (key: (typeof CATALOG)[number]["key"], name: string) => `${key}-${slug(name)}`;

export const mahazaCategories: string[] = CATALOG.map((c) => c.category);

export const mahazaServices: Service[] = CATALOG.flatMap((c) =>
  c.services.map((name): Service => ({ id: sid(c.key, name), name, category: c.category })),
);

const idsOf = (key: (typeof CATALOG)[number]["key"]) => CATALOG.find((c) => c.key === key)!.services.map((n) => sid(key, n));

// ---------------------------------------------------------------------------
// Praticiens et salles par site (FICTIF)
// ---------------------------------------------------------------------------

type RoleKey = "nails" | "face" | "body" | "eyes" | "hair" | "kids";

const ROLES: Record<RoleKey, { role: string; serviceIds: string[] }> = {
  nails: { role: "Prothésiste ongulaire", serviceIds: idsOf("mp") },
  face: { role: "Esthéticienne", serviceIds: [...idsOf("vi"), ...idsOf("ep")] },
  body: { role: "Spa-thérapeute", serviceIds: idsOf("co") },
  eyes: { role: "Experte regard & make-up", serviceIds: idsOf("re") },
  hair: { role: "Coiffeuse", serviceIds: [...idsOf("cf"), sid("en", "Coiffure garçon"), sid("en", "Coiffure fille")] },
  kids: {
    role: "Praticien homme & enfant",
    serviceIds: [...idsOf("ho"), ...idsOf("en").filter((id) => !id.startsWith("en-coiffure"))],
  },
};
const ROLE_ORDER: RoleKey[] = ["nails", "face", "body", "eyes", "hair", "kids"];

// Noms inventés (FICTIF), un par rôle et par site.
const STAFF_NAMES: Record<string, string[]> = {
  "douala-bonapriso": ["Nadège T.", "Aïcha N.", "Mireille K.", "Carole B.", "Estelle M.", "Désiré E."],
  "douala-yassa": ["Sandra F.", "Brigitte L.", "Noëlle M.", "Larissa T.", "Prisca A.", "Hervé N."],
  "yaounde-bastos": ["Pauline D.", "Julienne O.", "Cynthia B.", "Raïssa K.", "Adèle E.", "Boris T."],
  "yaounde-dragage": ["Mariam D.", "Floriane S.", "Ketsia M.", "Yolande P.", "Odile N.", "Cédric A."],
  "best-western-airport": ["Laetitia W.", "Rosine C.", "Inès B.", "Esther J.", "Gisèle H.", "Alain M."],
};

export const mahazaPractitioners: Practitioner[] = mahazaSites.flatMap((site) =>
  ROLE_ORDER.map((role, i): Practitioner => ({
    id: `${site.id}-p${i + 1}`,
    siteId: site.id,
    name: STAFF_NAMES[site.id][i],
    role: ROLES[role].role,
    serviceIds: ROLES[role].serviceIds,
    active: true,
    fictive: true,
  })),
);

const ROOM_DEFS = [
  { key: "mains", name: "Espace mains & pieds", description: "Postes de manucure et de pédicure.", categories: ["Beauté des mains et des pieds"] },
  { key: "visage", name: "Cabine visage & regard", description: "Soins du visage, épilation, cils et maquillage.", categories: ["Soin de visage", "Épilation", "Beauté du regard"] },
  { key: "corps", name: "Espace hammam & corps", description: "Hammam, sauna, jacuzzi et massages.", categories: ["Soin du corps"] },
  { key: "coiffure", name: "Salon de coiffure", description: "Espace coiffure avec bacs de lavage.", categories: ["Coiffure femme"] },
  { key: "famille", name: "Espace homme & enfant", description: "Soins pour homme et pour enfant.", categories: ["Soin pour homme", "Soin pour enfant (garçon et fille)"] },
] as const;

export const mahazaRooms: Room[] = mahazaSites.flatMap((site) =>
  ROOM_DEFS.map((r): Room => ({
    id: `${site.id}-r-${r.key}`,
    siteId: site.id,
    name: r.name,
    description: r.description,
    categories: [...r.categories],
    active: true,
    fictive: true,
  })),
);

// ---------------------------------------------------------------------------
// Réservations seed par site (FICTIF : clients, horaires, statuts d'acompte)
// ---------------------------------------------------------------------------

type CatKey = (typeof CATALOG)[number]["key"];
/** [jour (0 = lundi de la semaine en cours), heure, clé catégorie, nom du service, acompte reçu] */
type SeedRow = [number, string, CatKey, string, boolean];

// Créneaux de 60 min (durée par défaut FICTIVE). Horaires : lun–ven dès 8h30, sam dès 10h, dim dès 11h, fermeture 20h.
const SEED_ROWS: Record<string, SeedRow[]> = {
  "douala-bonapriso": [
    [0, "09:00", "vi", "Hydrafacial", true],
    [0, "10:30", "mp", "Manucure spa", true],
    [0, "14:00", "co", "Rituel endocrinien", false],
    [1, "09:30", "re", "Extension de cils", true],
    [1, "11:00", "cf", "Brushing", true],
    [2, "15:00", "ho", "Massage relaxant", false],
    [3, "10:00", "co", "Hammam/Gommage", true],
    [4, "16:30", "mp", "Pédicure spa", false],
    [5, "11:00", "vi", "Soin éclat", true],
    [6, "14:00", "en", "Coiffure fille", false],
  ],
  "douala-yassa": [
    [0, "10:00", "mp", "Pose de vernis Gel", true],
    [1, "09:00", "co", "Massage relaxant et détente", true],
    [1, "13:00", "vi", "Soin acnéique", false],
    [2, "11:30", "ep", "Jambe et demi-jambes", true],
    [2, "17:00", "cf", "Tissage", false],
    [3, "09:30", "re", "Make-up jour", true],
    [4, "14:30", "ho", "Coiffure", true],
    [5, "12:00", "co", "Sauna", false],
    [6, "15:00", "mp", "Remplissage Gel", true],
  ],
  "yaounde-bastos": [
    [0, "09:00", "co", "Jacuzzi", true],
    [0, "11:00", "vi", "Soin anti-âge", false],
    [1, "10:00", "cf", "Coloration", true],
    [2, "14:00", "mp", "Pose de gel", true],
    [3, "09:30", "ep", "Sourcils", true],
    [3, "16:00", "re", "Make-up soir", false],
    [4, "11:00", "en", "Manucure", true],
    [5, "13:00", "co", "Soin anti-vergeture", false],
    [6, "12:00", "vi", "Peeling du visage", true],
  ],
  "yaounde-dragage": [
    [0, "12:00", "vi", "Soin classique", true],
    [1, "09:00", "mp", "Gainage", false],
    [1, "15:30", "co", "Couverture chauffante", true],
    [2, "10:30", "cf", "Lissage brésilien", true],
    [3, "13:30", "re", "Microblading", false],
    [4, "09:30", "ho", "Soin de visage", true],
    [4, "18:00", "mp", "Pose de vernis simple", true],
    [5, "10:30", "co", "Hammam/Gommage", false],
    [6, "16:00", "en", "Massage relaxant", true],
  ],
  "best-western-airport": [
    [0, "09:00", "co", "Massage relaxant et détente", true],
    [0, "13:00", "mp", "Manucure spa", false],
    [1, "10:00", "vi", "Hydrafacial", true],
    [2, "09:30", "re", "Remplissage de cils", true],
    [2, "16:00", "cf", "Pose frontale", false],
    [3, "11:00", "ep", "Maillot", true],
    [4, "15:00", "co", "Rituel endocrinien", true],
    [5, "14:00", "ho", "Pédicure", false],
    [6, "13:00", "vi", "Soin éclat", true],
  ],
};

// Noms et numéros inventés (FICTIF).
const CUSTOMERS = [
  "Carine Mbarga", "Ruth Tchoumi", "Sandrine Fotso", "Flore Ngassa", "Danielle Essomba", "Priscille Kamga",
  "Ornella Biyick", "Laure Nkoulou", "Brenda Ewane", "Mélanie Dongmo", "Nicole Manga", "Yvanna Tagne",
  "Estelle Pouth", "Gaëlle Mekou", "Josiane Abena", "Stéphanie Njoh", "Patricia Etoundi", "Armelle Kouam",
  "Chantal Wouembe", "Vanessa Ndjock", "Marlène Fouda", "Inès Tchamba", "Sylvie Bella", "Hortense Lekane",
  "Clarisse Ondoa", "Judith Abanda", "Laurence Mvondo", "Reine Atangana", "Sabine Owona", "Colette Eyenga",
  "Christelle Bikoko", "Viviane Tsogo", "Aurélie Nana", "Corinne Fokou", "Rachel Mouelle", "Eliane Tchuente",
  "Béatrice Ngo", "Ghislaine Zang", "Monique Edimo", "Lydie Sock", "Pélagie Menye", "Odette Nken",
  "Solange Mba", "Thérèse Ayissi", "Yolande Beyala", "Mirabelle Kenfack", "Florence Yimga",
];

let customerIdx = 0;
export const mahazaSeedBookings: SeedBooking[] = mahazaSites.flatMap((site) => {
  const siteRooms = mahazaRooms.filter((r) => r.siteId === site.id);
  const sitePractitioners = mahazaPractitioners.filter((p) => p.siteId === site.id);
  return SEED_ROWS[site.id].map(([dayOffset, start, key, name, depositReceived], i): SeedBooking => {
    const serviceId = sid(key, name);
    const category = CATALOG.find((c) => c.key === key)!.category;
    const n = customerIdx++;
    return {
      id: `b-${site.id}-${i + 1}`,
      siteId: site.id,
      serviceId,
      practitionerId: sitePractitioners.find((p) => p.serviceIds.includes(serviceId))!.id,
      roomId: siteRooms.find((r) => r.categories.includes(category))!.id,
      dayOffset,
      start,
      customerName: CUSTOMERS[n % CUSTOMERS.length],
      customerPhone: `+237 600 00 00 ${String(n + 1).padStart(2, "0")}`,
      depositReceived,
    };
  });
});
