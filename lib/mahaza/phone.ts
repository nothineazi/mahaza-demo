/** Chiffres seuls d'un numéro (pour wa.me). */
export const phoneDigits = (phone: string): string => phone.replace(/\D/g, "");

/**
 * Clé de rapprochement d'un numéro : les 9 derniers chiffres (numéro camerounais sans indicatif).
 * Permet de retrouver un client malgré les espaces ou le préfixe +237.
 */
export function phoneKey(phone: string): string {
  const d = phoneDigits(phone);
  return d.length > 9 ? d.slice(-9) : d;
}
