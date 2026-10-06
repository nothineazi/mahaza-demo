import { theme } from "@/theme.config";

export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

/**
 * Le vert WhatsApp d'origine (#1FA855) n'atteint pas 4,5:1 avec du texte blanc.
 * Pour Mahaza (palette AA) on utilise le vert « success » du thème ; St Louis garde le bouton d'origine.
 */
export const whatsappButtonClass = theme.id === "mahaza" ? "bg-success hover:bg-success/90" : undefined;
