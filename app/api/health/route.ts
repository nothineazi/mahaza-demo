// Sonde de santé (conteneur / reverse proxy) : aucune donnée, aucun secret, aucun accès externe.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok", theme: process.env.NEXT_PUBLIC_THEME ?? "mahaza" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
