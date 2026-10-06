import type { Service } from "@/data/types";
import { formatDuration } from "@/lib/utils";

/**
 * Durée cumulée d'un panier. Renvoie `null` tant qu'une des durées est inconnue :
 * on n'affiche alors aucune durée (pas d'invention).
 */
export function cartTotalDuration(services: Pick<Service, "durationMin">[]): number | null {
  if (services.length === 0) return null;
  let total = 0;
  for (const s of services) {
    if (s.durationMin == null) return null;
    total += s.durationMin;
  }
  return total;
}

export function cartDurationLabel(services: Pick<Service, "durationMin">[]): string | null {
  const total = cartTotalDuration(services);
  return total == null ? null : formatDuration(total);
}
