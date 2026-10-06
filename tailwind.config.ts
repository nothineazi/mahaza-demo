import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

// Build St Louis : les composants premium Mahaza ne sont pas analysés (le CSS St Louis reste identique).
const stlouis = process.env.NEXT_PUBLIC_THEME === "stlouis";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", ...(stlouis ? ["!./components/mahaza/**"] : [])],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: token("card"),
        "card-foreground": token("card-foreground"),
        primary: token("primary"),
        "primary-foreground": token("primary-foreground"),
        secondary: token("secondary"),
        "secondary-foreground": token("secondary-foreground"),
        muted: token("muted"),
        "muted-foreground": token("muted-foreground"),
        accent: token("accent"),
        "accent-foreground": token("accent-foreground"),
        border: token("border"),
        ring: token("primary"),
        destructive: token("destructive"),
        success: token("success"),
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        sans: ["var(--font-body)"],
      },
      // Ombres du thème premium Mahaza (variables définies dans lib/mahaza/mahaza.css).
      boxShadow: {
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [animate],
};

export default config;
