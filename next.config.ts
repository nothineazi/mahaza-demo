import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
