import type { Practitioner, Room, SeedBooking, Service } from "./types";

export const mahazaCategories = ["Soins du visage", "Ongles", "Coiffure", "Corps & bien-être"];

export const mahazaServices: Service[] = [
  { id: "s1", name: "Soin éclat visage", description: "Nettoyage, gommage doux, masque et massage du visage pour un teint lumineux.", category: "Soins du visage", durationMin: 60, price: 15000 },
  { id: "s2", name: "Nettoyage de peau profond", description: "Extraction, vapeur et masque purifiant, idéal pour les peaux mixtes à grasses.", category: "Soins du visage", durationMin: 75, price: 20000 },
  { id: "s3", name: "Manucure classique", description: "Mise en forme, soin des cuticules et pose de vernis.", category: "Ongles", durationMin: 45, price: 6000 },
  { id: "s4", name: "Pose gel", description: "Pose de gel avec finition au choix, tenue jusqu'à trois semaines.", category: "Ongles", durationMin: 90, price: 15000 },
  { id: "s5", name: "Pédicure spa", description: "Bain relaxant, gommage, soin des pieds et vernis.", category: "Ongles", durationMin: 60, price: 10000 },
  { id: "s6", name: "Brushing", description: "Lavage, soin et mise en forme.", category: "Coiffure", durationMin: 45, price: 5000 },
  { id: "s7", name: "Tresses & coiffures protectrices", description: "Tresses, vanilles ou nattes collées selon votre envie.", category: "Coiffure", durationMin: 150, price: 20000 },
  { id: "s8", name: "Massage relaxant", description: "Massage du corps aux huiles chaudes pour relâcher les tensions.", category: "Corps & bien-être", durationMin: 60, price: 18000 },
  { id: "s9", name: "Gommage & enveloppement", description: "Gommage du corps suivi d'un enveloppement hydratant.", category: "Corps & bien-être", durationMin: 90, price: 25000 },
];

export const mahazaPractitioners: Practitioner[] = [
  { id: "p1", name: "Aïcha N.", role: "Esthéticienne", serviceIds: ["s1", "s2", "s9"], active: true },
  { id: "p2", name: "Nadège T.", role: "Prothésiste ongulaire", serviceIds: ["s3", "s4", "s5"], active: true },
  { id: "p3", name: "Estelle M.", role: "Coiffeuse", serviceIds: ["s6", "s7"], active: true },
  { id: "p4", name: "Mireille K.", role: "Masseuse", serviceIds: ["s8", "s9"], active: true },
];

export const mahazaRooms: Room[] = [
  { id: "r1", name: "Cabine Rose", description: "Cabine de soins du visage et du corps.", categories: ["Soins du visage", "Corps & bien-être"], active: true },
  { id: "r2", name: "Cabine Or", description: "Cabine de massage et d'enveloppement.", categories: ["Corps & bien-être", "Soins du visage"], active: true },
  { id: "r3", name: "Espace mains & pieds", description: "Postes de manucure et pédicure.", categories: ["Ongles"], active: true },
  { id: "r4", name: "Salon coiffure", description: "Espace coiffure avec bacs de lavage.", categories: ["Coiffure"], active: true },
];

const b = (
  id: string, dayOffset: number, start: string, serviceId: string, practitionerId: string, roomId: string,
  customerName: string, customerPhone: string, depositReceived: boolean,
): SeedBooking => ({ id, dayOffset, start, serviceId, practitionerId, roomId, customerName, customerPhone, depositReceived });

export const mahazaSeedBookings: SeedBooking[] = [
  b("b1", 0, "09:30", "s1", "p1", "r1", "Carine Mbarga", "+237 600 00 00 01", true),
  b("b2", 0, "10:00", "s4", "p2", "r3", "Ruth Tchoumi", "+237 600 00 00 02", true),
  b("b3", 0, "14:00", "s8", "p4", "r2", "Sandrine Fotso", "+237 600 00 00 03", true),
  b("b4", 1, "10:00", "s6", "p3", "r4", "Flore Ngassa", "+237 600 00 00 04", true),
  b("b5", 1, "11:00", "s2", "p1", "r1", "Danielle Essomba", "+237 600 00 00 05", false),
  b("b6", 1, "15:00", "s3", "p2", "r3", "Priscille Kamga", "+237 600 00 00 06", true),
  b("b7", 2, "09:00", "s7", "p3", "r4", "Ornella Biyick", "+237 600 00 00 07", true),
  b("b8", 2, "13:00", "s9", "p4", "r2", "Laure Nkoulou", "+237 600 00 00 08", false),
  b("b9", 2, "16:00", "s5", "p2", "r3", "Brenda Ewane", "+237 600 00 00 09", true),
  b("b10", 3, "10:00", "s1", "p1", "r1", "Mélanie Dongmo", "+237 600 00 00 10", true),
  b("b11", 3, "11:00", "s8", "p4", "r2", "Nicole Manga", "+237 600 00 00 11", false),
  b("b12", 4, "09:00", "s4", "p2", "r3", "Yvanna Tagne", "+237 600 00 00 12", true),
  b("b13", 4, "14:00", "s2", "p1", "r1", "Estelle Pouth", "+237 600 00 00 13", false),
  b("b14", 4, "15:30", "s6", "p3", "r4", "Gaëlle Mekou", "+237 600 00 00 14", true),
  b("b15", 5, "09:00", "s7", "p3", "r4", "Josiane Abena", "+237 600 00 00 15", true),
  b("b16", 5, "10:00", "s3", "p2", "r3", "Stéphanie Njoh", "+237 600 00 00 16", false),
  b("b17", 5, "11:00", "s1", "p1", "r1", "Patricia Etoundi", "+237 600 00 00 17", true),
  b("b18", 5, "12:00", "s9", "p4", "r2", "Armelle Kouam", "+237 600 00 00 18", false),
  b("b19", 7, "10:00", "s1", "p1", "r1", "Chantal Wouembe", "+237 600 00 00 19", false),
  b("b20", 7, "15:00", "s8", "p4", "r2", "Vanessa Ndjock", "+237 600 00 00 20", false),
  b("b21", 8, "11:00", "s4", "p2", "r3", "Marlène Fouda", "+237 600 00 00 21", true),
  b("b22", 8, "14:00", "s6", "p3", "r4", "Inès Tchamba", "+237 600 00 00 22", false),
  b("b23", 9, "09:30", "s2", "p1", "r1", "Sylvie Bella", "+237 600 00 00 23", true),
  b("b24", 10, "13:30", "s5", "p2", "r3", "Hortense Lekane", "+237 600 00 00 24", false),
];
