import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
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
