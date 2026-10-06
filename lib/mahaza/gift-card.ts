import type { PremiumConfig } from "@/data/types";
import { formatPrice } from "@/lib/utils";
import { phoneDigits } from "./phone";

// 32 caractères sans I, O, 0, 1 (ambigus) : 256 % 32 = 0, donc aucun biais de tirage.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Code fictif « GC-XXXX-XXXX ». À appeler depuis un gestionnaire d'événement (pas au rendu : hydratation). */
export function generateGiftCode(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = random(8);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return `GC-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

export type AmountCheck = { ok: true; amount: number } | { ok: false; reason: string };

/** Montant libre : entier dans la fourchette réelle du site (20 000 – 100 000 FCFA), au pas configuré (FICTIF). */
export function validateGiftAmount(raw: string | number, cfg: PremiumConfig["giftCard"]): AmountCheck {
  const amount = typeof raw === "number" ? raw : Number(String(raw).replace(/\s/g, ""));
  if (!Number.isInteger(amount)) return { ok: false, reason: "Saisissez un montant entier en FCFA." };
  if (amount < cfg.minAmount || amount > cfg.maxAmount) {
    return { ok: false, reason: `Le montant doit être compris entre ${formatPrice(cfg.minAmount)} et ${formatPrice(cfg.maxAmount)}.` };
  }
  if (amount % cfg.stepAmount !== 0) return { ok: false, reason: `Le montant doit être un multiple de ${formatPrice(cfg.stepAmount)}.` };
  return { ok: true, amount };
}

export interface GiftCardDraft {
  code: string;
  amount: number;
  from: string;
  to: string;
  message: string;
}

export function giftCardMessage(card: GiftCardDraft, brand: string): string {
  return [
    `${card.to ? `Bonjour ${card.to}` : "Bonjour"}, ${card.from || "quelqu'un qui pense à vous"} vous offre une carte cadeau ${brand} de ${formatPrice(card.amount)} !`,
    card.message ? `« ${card.message} »` : "",
    `Code : ${card.code} (carte fictive de démonstration, non valable).`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Lien wa.me : vers le destinataire si son numéro est connu, sinon sélecteur de contact WhatsApp. */
export function giftCardWaLink(recipientPhone: string, message: string): string {
  const digits = phoneDigits(recipientPhone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
