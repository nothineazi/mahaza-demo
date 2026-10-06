import { Cormorant_Garamond } from "next/font/google";
// Le CSS premium est importé ici : ce module n'est chargé que pour le thème Mahaza (voir app/layout.tsx).
import "./mahaza.css";

/** Police d'affichage (titres). Repli auto-ajusté par next/font : pas de décalage de mise en page. */
export const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
