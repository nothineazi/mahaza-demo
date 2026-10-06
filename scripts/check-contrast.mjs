#!/usr/bin/env node
// Vérifie les rapports de contraste WCAG AA (texte ≥ 4,5:1 ; composants d'interface ≥ 3:1) des couples
// utilisés par le thème premium Mahaza. Usage : node scripts/check-contrast.mjs
const C = {
  background: "#FFFBF4", foreground: "#2E2A2B", card: "#FFFFFF", primary: "#7A5806", primaryForeground: "#FFFFFF",
  secondary: "#F8EFD8", secondaryForeground: "#4A3604", muted: "#F4EEE6", mutedForeground: "#645D5E",
  accent: "#E9B93C", accentForeground: "#2B2105", border: "#E8DCC8", success: "#17703F", destructive: "#B42323",
};

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const mix = (fg, bg, a) => hex(rgb(fg).map((v, i) => v * a + rgb(bg)[i] * (1 - a)));
const lum = (h) => {
  const [r, g, b] = rgb(h).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [libellé, premier plan, arrière-plan, seuil]
const pairs = [
  ["Texte courant sur fond", C.foreground, C.background, 4.5],
  ["Texte sur carte blanche", C.foreground, C.card, 4.5],
  ["Texte sur fond secondaire (crème)", C.foreground, C.secondary, 4.5],
  ["Texte secondaire-foreground sur secondaire", C.secondaryForeground, C.secondary, 4.5],
  ["Texte secondaire sur secondaire/50 (sélection)", C.secondaryForeground, mix(C.secondary, C.background, 0.5), 4.5],
  ["Texte atténué sur fond", C.mutedForeground, C.background, 4.5],
  ["Texte atténué sur carte", C.mutedForeground, C.card, 4.5],
  ["Texte atténué sur muted", C.mutedForeground, C.muted, 4.5],
  ["Texte atténué sur secondaire", C.mutedForeground, C.secondary, 4.5],
  ["Texte atténué sur fond admin (muted/40)", C.mutedForeground, mix(C.muted, C.background, 0.4), 4.5],
  ["Texte atténué sur muted/60", C.mutedForeground, mix(C.muted, C.background, 0.6), 4.5],
  ["Primaire (liens, titres) sur fond", C.primary, C.background, 4.5],
  ["Primaire sur carte", C.primary, C.card, 4.5],
  ["Primaire sur secondaire", C.primary, C.secondary, 4.5],
  ["Primaire sur muted/40 (admin)", C.primary, mix(C.muted, C.background, 0.4), 4.5],
  ["Bouton primaire (blanc sur primaire)", C.primaryForeground, C.primary, 4.5],
  ["Bouton primaire au survol (primaire/90)", C.primaryForeground, mix(C.primary, C.background, 0.9), 4.5],
  ["Bouton or (texte sur accent)", C.accentForeground, C.accent, 4.5],
  ["Bouton or au survol (accent/90)", C.accentForeground, mix(C.accent, C.background, 0.9), 4.5],
  ["Pastille « en attente » (texte sur accent/25 sur carte)", C.foreground, mix(C.accent, C.card, 0.25), 4.5],
  ["Bloc planning en attente (texte sur accent/25)", C.foreground, mix(C.accent, C.card, 0.25), 4.5],
  ["Texte atténué sur bloc planning en attente", C.mutedForeground, mix(C.accent, C.card, 0.25), 4.5],
  ["Succès sur carte", C.success, C.card, 4.5],
  ["Succès sur succès/12 (pastille)", C.success, mix(C.success, C.card, 0.12), 4.5],
  ["Succès sur succès/10 (notice)", C.success, mix(C.success, C.background, 0.1), 4.5],
  ["Blanc sur succès (bouton WhatsApp)", "#FFFFFF", C.success, 4.5],
  ["Blanc sur succès/90 (survol WhatsApp)", "#FFFFFF", mix(C.success, C.background, 0.9), 4.5],
  ["Texte sur bloc planning confirmé (succès/15)", C.foreground, mix(C.success, C.card, 0.15), 4.5],
  ["Texte atténué sur bloc confirmé", C.mutedForeground, mix(C.success, C.card, 0.15), 4.5],
  ["Destructif sur carte", C.destructive, C.card, 4.5],
  ["Destructif sur destructif/10", C.destructive, mix(C.destructive, C.card, 0.1), 4.5],
  ["Destructif sur destructif/5", C.destructive, mix(C.destructive, C.background, 0.05), 4.5],
  ["Texte sur bloc no-show (destructif/10)", C.foreground, mix(C.destructive, C.card, 0.1), 4.5],
  ["Pied de page : crème sur charbon", C.background, C.foreground, 4.5],
  ["Pied de page : crème/80 sur charbon", mix(C.background, C.foreground, 0.8), C.foreground, 4.5],
  ["Pied de page : crème/75 sur charbon", mix(C.background, C.foreground, 0.75), C.foreground, 4.5],
  ["Pied de page : crème/70 sur charbon", mix(C.background, C.foreground, 0.7), C.foreground, 4.5],
  ["Pied de page / hero : or sur charbon", C.accent, C.foreground, 4.5],
  ["Hero : crème/90 sur voile charbon/75, photo blanche (pire cas)", mix(C.background, mix(C.foreground, "#FFFFFF", 0.75), 0.9), mix(C.foreground, "#FFFFFF", 0.75), 4.5],
  ["Carte cadeau : crème/85 sur charbon", mix(C.background, C.foreground, 0.85), C.foreground, 4.5],
  ["Carte cadeau : or sur charbon", C.accent, C.foreground, 4.5],
  ["Infobulle graphique : crème sur charbon", C.background, C.foreground, 4.5],
  ["Chiffre rouge urgent (compte à rebours) sur destructif/5", C.destructive, mix(C.destructive, C.background, 0.05), 4.5],
  ["Compte à rebours : texte sur secondaire", C.foreground, C.secondary, 4.5],
  // Composants d'interface (WCAG 1.4.11, ≥ 3:1)
  ["Bordure des champs (foreground/55) sur carte", mix(C.foreground, C.card, 0.55), C.card, 3],
  ["Piste d'interrupteur éteinte (muted-foreground/70) sur carte", mix(C.mutedForeground, C.card, 0.7), C.card, 3],
  ["Anneau de focus (primaire) sur fond", C.primary, C.background, 3],
  ["Anneau de focus (primaire) sur carte", C.primary, C.card, 3],
  ["Barre de progression (primaire) sur piste (border)", C.primary, C.border, 3],
];

let bad = 0;
for (const [label, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) bad++;
  console.log(`${ok ? "OK  " : "FAIL"} ${r.toFixed(2).padStart(5)}:1 (≥ ${min})  ${label}`);
}
console.log(bad ? `\n${bad} couple(s) sous le seuil` : `\nTous les couples (${pairs.length}) respectent le seuil WCAG AA`);
process.exit(bad ? 1 : 0);
