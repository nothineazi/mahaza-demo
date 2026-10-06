import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Racine de traçage = ce dossier, même si un autre package-lock.json existe plus haut (sinon `.next/standalone/server.js`
  // est déplacé dans un sous-dossier et `npm start` ne le trouve plus).
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  webpack(config) {
    // Le thème est figé au build (NEXT_PUBLIC_THEME) : le cache webpack ne doit pas être partagé d'un thème à l'autre
    // (sinon un build St Louis pourrait réutiliser du CSS / JS issu d'un build Mahaza).
    if (config.cache && typeof config.cache === "object") {
      config.cache.version = `theme-${process.env.NEXT_PUBLIC_THEME ?? "mahaza"}`;
    }
    return config;
  },
};

export default nextConfig;
