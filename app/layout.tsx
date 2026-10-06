import type { Metadata, Viewport } from "next";
import type { CSSProperties, ReactNode } from "react";
import { theme } from "@/theme.config";
import { hexToChannels } from "@/lib/utils";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${theme.name} — ${theme.tagline}`, template: `%s · ${theme.name}` },
  description: theme.description,
  icons: theme.icon ? { icon: [{ url: theme.icon.src, type: theme.icon.type }], apple: theme.icon.src } : { icon: "/icon.svg" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: theme.colors.background,
  width: "device-width",
  initialScale: 1,
};

const c = theme.colors;
const themeVars = {
  "--background": hexToChannels(c.background),
  "--foreground": hexToChannels(c.foreground),
  "--card": hexToChannels(c.card),
  "--primary": hexToChannels(c.primary),
  "--primary-foreground": hexToChannels(c.primaryForeground),
  "--secondary": hexToChannels(c.secondary),
  "--secondary-foreground": hexToChannels(c.secondaryForeground),
  "--muted": hexToChannels(c.muted),
  "--muted-foreground": hexToChannels(c.mutedForeground),
  "--accent": hexToChannels(c.accent),
  "--accent-foreground": hexToChannels(c.accentForeground),
  "--border": hexToChannels(c.border),
  "--success": hexToChannels(c.success),
  "--destructive": hexToChannels(c.destructive),
  "--radius": theme.radius,
  "--font-heading": theme.fonts.heading,
  "--font-body": theme.fonts.body,
} as CSSProperties;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" style={themeVars} data-theme={theme.id}>
      <body className="min-h-dvh">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
