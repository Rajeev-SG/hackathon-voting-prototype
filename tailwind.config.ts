import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const makeScale = (prefix: string) =>
  Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => {
      const step = index + 1;
      return [step, `var(--${prefix}-${step})`];
    })
  );

const makeAlphaScale = (prefix: string) =>
  Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => {
      const step = index + 1;
      return [step, `var(--${prefix}-a${step})`];
    })
  );

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1280px"
      }
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        success: "var(--success)",
        warning: "var(--warning)",
        "radix-gray": makeScale("gray"),
        "radix-gray-a": makeAlphaScale("gray"),
        "radix-teal": makeScale("teal"),
        "radix-teal-a": makeAlphaScale("teal"),
        "radix-purple": makeScale("purple"),
        "radix-purple-a": makeAlphaScale("purple")
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"]
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)"
      },
      boxShadow: {
        halo: "0 24px 80px var(--shadow-strong)",
        panel: "0 18px 52px var(--shadow-soft)"
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(90deg, transparent 0, transparent calc(100% - 1px), var(--grid-line) calc(100% - 1px)), linear-gradient(180deg, transparent 0, transparent calc(100% - 1px), var(--grid-line) calc(100% - 1px))",
        "teal-radial":
          "radial-gradient(circle at top, var(--hero-glow) 0%, transparent 55%)"
      }
    }
  },
  plugins: [animate]
};

export default config;
