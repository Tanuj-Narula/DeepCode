import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "text-primary": "var(--dc-text-primary)",
        "text-secondary": "var(--dc-text-secondary)",
        "text-tertiary": "var(--dc-text-muted)",
        "text-muted": "var(--dc-text-muted)",
        "bg-primary": "var(--dc-bg-primary)",
        "bg-secondary": "var(--dc-bg-secondary)",
        "border": "var(--dc-border)",
      },
      fontFamily: {
        sans: ["var(--font-ibm-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-ibm-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
