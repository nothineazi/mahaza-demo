import type { BookingStatus, Client, LoyaltyTier, PremiumConfig } from "@/data/types";

export interface Loyalty {
  points: number;
  visits: number;
  tier: LoyaltyTier;
  next: LoyaltyTier | null;
  /** Points restants avant le palier suivant (0 si palier maximal). */
  toNext: number;
  /** Progression 0..1 vers le palier suivant. */
  progress: number;
}

/** Points de fidélité (FICTIFS) : visites terminées × points par visite + bonus du client. */
export function loyaltyFor(client: Pick<Client, "bonusPoints">, statuses: BookingStatus[], cfg: PremiumConfig["loyalty"]): Loyalty {
  const visits = statuses.filter((s) => s === "completed").length;
  const points = visits * cfg.pointsPerVisit + client.bonusPoints;
  const tiers = [...cfg.tiers].sort((a, b) => a.minPoints - b.minPoints);
  let tier = tiers[0];
  for (const t of tiers) if (points >= t.minPoints) tier = t;
  const next = tiers.find((t) => t.minPoints > points) ?? null;
  const progress = next ? (points - tier.minPoints) / (next.minPoints - tier.minPoints) : 1;
  return { points, visits, tier, next, toNext: next ? next.minPoints - points : 0, progress };
}
