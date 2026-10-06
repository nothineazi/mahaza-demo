import type { Practitioner, Room, SeedBooking, Service } from "./types";

export const stlouisCategories = ["Coupe", "Barbe", "Soins & couleur"];

export const stlouisServices: Service[] = [
  { id: "s1", name: "Coupe homme", description: "Coupe aux ciseaux ou à la tondeuse, finitions soignées.", category: "Coupe", durationMin: 30, price: 3000 },
  { id: "s2", name: "Dégradé & contours", description: "Dégradé net, lignes et contours au rasoir.", category: "Coupe", durationMin: 45, price: 4000 },
  { id: "s3", name: "Coupe enfant", description: "Coupe pour les garçons jusqu'à 12 ans.", category: "Coupe", durationMin: 30, price: 2500 },
  { id: "s4", name: "Taille de barbe", description: "Taille, mise en forme et huile de finition.", category: "Barbe", durationMin: 30, price: 2500 },
  { id: "s5", name: "Rasage serviette chaude", description: "Rasage traditionnel au coupe-chou avec serviette chaude.", category: "Barbe", durationMin: 30, price: 3500 },
  { id: "s6", name: "Coupe + barbe", description: "La formule complète : coupe et barbe dans la même séance.", category: "Coupe", durationMin: 60, price: 6000 },
  { id: "s7", name: "Soin du visage homme", description: "Nettoyage, gommage et masque hydratant.", category: "Soins & couleur", durationMin: 45, price: 7000 },
  { id: "s8", name: "Coloration & camouflage", description: "Coloration cheveux ou barbe, camouflage des cheveux blancs.", category: "Soins & couleur", durationMin: 60, price: 8000 },
];

export const stlouisPractitioners: Practitioner[] = [
  { id: "p1", name: "Jean-Paul E.", role: "Maître barbier", serviceIds: ["s1", "s2", "s4", "s5", "s6"], active: true },
  { id: "p2", name: "Brice M.", role: "Barbier", serviceIds: ["s1", "s2", "s3", "s4", "s6"], active: true },
  { id: "p3", name: "Kevin T.", role: "Barbier junior", serviceIds: ["s1", "s3", "s4"], active: true },
  { id: "p4", name: "Landry N.", role: "Coloriste & soins", serviceIds: ["s7", "s8"], active: true },
];

export const stlouisRooms: Room[] = [
  { id: "r1", name: "Fauteuil 1", description: "Poste de coupe et barbe.", categories: ["Coupe", "Barbe"], active: true },
  { id: "r2", name: "Fauteuil 2", description: "Poste de coupe et barbe.", categories: ["Coupe", "Barbe"], active: true },
  { id: "r3", name: "Espace VIP", description: "Espace privé, tous services.", categories: ["Coupe", "Barbe", "Soins & couleur"], active: true },
  { id: "r4", name: "Espace soins", description: "Coin soins du visage et coloration.", categories: ["Soins & couleur"], active: true },
];

const b = (
  id: string, dayOffset: number, start: string, serviceId: string, practitionerId: string, roomId: string,
  customerName: string, customerPhone: string, depositReceived: boolean,
): SeedBooking => ({ id, dayOffset, start, serviceId, practitionerId, roomId, customerName, customerPhone, depositReceived });

export const stlouisSeedBookings: SeedBooking[] = [
  b("b1", 0, "09:00", "s1", "p1", "r1", "Armand Nkeng", "+237 600 00 01 01", true),
  b("b2", 0, "09:00", "s3", "p3", "r2", "Éric Tamo", "+237 600 00 01 02", true),
  b("b3", 0, "10:00", "s6", "p2", "r1", "Franck Ondoa", "+237 600 00 01 03", true),
  b("b4", 0, "11:00", "s7", "p4", "r4", "Hervé Bayiha", "+237 600 00 01 04", false),
  b("b5", 1, "09:30", "s2", "p1", "r1", "Serge Mouaha", "+237 600 00 01 05", true),
  b("b6", 1, "10:00", "s4", "p3", "r2", "Boris Kenfack", "+237 600 00 01 06", false),
  b("b7", 1, "14:00", "s8", "p4", "r4", "Alain Nana", "+237 600 00 01 07", true),
  b("b8", 2, "10:00", "s5", "p1", "r1", "Rodrigue Sime", "+237 600 00 01 08", true),
  b("b9", 2, "11:00", "s6", "p2", "r3", "Cédric Ebogo", "+237 600 00 01 09", false),
  b("b10", 2, "15:00", "s1", "p3", "r2", "Wilfried Zanga", "+237 600 00 01 10", true),
  b("b11", 3, "09:00", "s6", "p1", "r1", "Hugues Mbock", "+237 600 00 01 11", true),
  b("b12", 3, "12:00", "s2", "p2", "r2", "Aristide Kouo", "+237 600 00 01 12", false),
  b("b13", 3, "16:00", "s7", "p4", "r4", "Thierry Fokou", "+237 600 00 01 13", true),
  b("b14", 4, "10:30", "s1", "p1", "r1", "Parfait Ntamack", "+237 600 00 01 14", true),
  b("b15", 4, "15:00", "s6", "p2", "r3", "Gérard Atangana", "+237 600 00 01 15", false),
  b("b16", 4, "17:00", "s3", "p3", "r2", "Désiré Yimga", "+237 600 00 01 16", false),
  b("b17", 5, "09:00", "s2", "p1", "r1", "Romaric Tchinda", "+237 600 00 01 17", true),
  b("b18", 5, "09:30", "s1", "p2", "r2", "Loïc Bidzanga", "+237 600 00 01 18", true),
  b("b19", 5, "10:00", "s8", "p4", "r4", "Dieudonné Mvondo", "+237 600 00 01 19", false),
  b("b20", 5, "11:00", "s6", "p2", "r3", "Cyrille Nguimfack", "+237 600 00 01 20", true),
  b("b21", 6, "10:00", "s4", "p1", "r1", "Junior Eyenga", "+237 600 00 01 21", false),
  b("b22", 7, "09:30", "s6", "p2", "r1", "Martial Bekolo", "+237 600 00 01 22", false),
  b("b23", 7, "14:00", "s8", "p4", "r4", "Jacques Moukoko", "+237 600 00 01 23", false),
  b("b24", 8, "11:00", "s2", "p1", "r2", "Patrick Ewodo", "+237 600 00 01 24", true),
  b("b25", 9, "16:00", "s5", "p1", "r1", "Samuel Tchakounté", "+237 600 00 01 25", false),
];
