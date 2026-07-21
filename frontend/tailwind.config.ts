import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {

    container: {
      center: true,
      padding: "32px",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        0: "0",
        px: "1px",
        0.5: "2px",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
        24: "96px",
      },
      fontSize: {
        mono: ["12px", { lineHeight: "1.5", letterSpacing: "0.05em" }],
        caption: ["11px", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        label: ["12px", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        "body-sm": ["13px", { lineHeight: "1.5", letterSpacing: "0" }],
        body: ["14px", { lineHeight: "1.6", letterSpacing: "0" }],
        heading: ["20px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        title: ["24px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        hero: ["48px", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "800" }],
        display: ["32px", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "800" }],
      },
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          functional: "var(--accent-functional)",
          success: "var(--accent-success)",
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          focus: "var(--border-focus)",
        },
        glass: {
          0: "var(--glass-0)",
          1: "var(--glass-1)",
          2: "var(--glass-2)",
          3: "var(--glass-3)",
          4: "var(--glass-4)",
        }
      },
      boxShadow: {
        "elevation-surface": "0 1px 2px rgba(0,0,0,0.4) /* contact */",
        "elevation-floating": "0 2px 4px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
        "elevation-elevated": "0 4px 8px rgba(0,0,0,0.2), 0 16px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        "elevation-modal": "0 8px 16px rgba(0,0,0,0.3), 0 24px 64px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.08)",
        "elevation-hero": "0 16px 32px rgba(0,0,0,0.4), 0 32px 96px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.15)",
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        medium: "var(--duration-medium)",
        slow: "var(--duration-slow)",
        ambient: "var(--duration-ambient)",
      },
      keyframes: {
        heroFloat: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        heroBreathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.004)" },
        },
        nodePulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.05)", opacity: "1", filter: "brightness(1.2)" },
        },
        tagFade: {
          "0%, 100%": { opacity: "0", transform: "translateY(4px)" },
          "10%, 90%": { opacity: "1", transform: "translateY(0)" },
        },
        lineTravel: {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        cardReveal: {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        ambientDrift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(3%, 4%) scale(1.05)" },
          "66%": { transform: "translate(-2%, 2%) scale(0.95)" },
        }
      },
      animation: {
        "hero-float": "heroFloat 12s ease-in-out infinite",
        "hero-breathe": "heroBreathe 22s ease-in-out infinite",
        "node-pulse": "nodePulse var(--duration-ambient) ease-in-out infinite",
        "tag-fade": "tagFade var(--duration-ambient) ease-in-out infinite",
        "line-travel": "lineTravel var(--duration-ambient) linear infinite",
        "card-reveal": "cardReveal var(--duration-medium) cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "ambient-drift": "ambientDrift var(--duration-ambient) ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
