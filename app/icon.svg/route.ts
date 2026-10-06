import { theme } from "@/theme.config";

export const dynamic = "force-static";

/** Favicon placeholder : initiale de la marque sur la couleur primaire. */
export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${theme.colors.primary}"/><text x="32" y="44" font-family="Georgia,serif" font-size="36" font-weight="700" text-anchor="middle" fill="${theme.colors.primaryForeground}">${theme.name.charAt(0)}</text></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
