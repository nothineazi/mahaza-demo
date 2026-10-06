/**
 * Classe racine du thème premium (variable CSS de la police d'affichage) + import du CSS premium.
 * Le `require` est volontairement placé derrière un test sur NEXT_PUBLIC_THEME : la valeur est inlinée au build,
 * la branche morte est éliminée et le build St Louis n'embarque ni la police ni le CSS Mahaza (HTML St Louis inchangé).
 */
export const premiumRootClass: string | undefined =
  process.env.NEXT_PUBLIC_THEME === "stlouis"
    ? undefined
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require("./fonts") as typeof import("./fonts")).displayFont.variable;
