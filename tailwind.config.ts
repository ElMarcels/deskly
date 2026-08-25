/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a1a",
        foreground: "#e0e0ff",
        surface: "#12122a",
        "surface-light": "#1a1a3e",
        "neon-purple": "#a855f7",
        "neon-magenta": "#ec4899",
        "neon-cyan": "#06b6d4",
        "neon-blue": "#3b82f6",
        "neon-pink": "#f472b6",
        "neon-violet": "#8b5cf6",
        "glass-bg": "rgba(18, 18, 42, 0.6)",
        "glass-border": "rgba(168, 85, 247, 0.2)",
        "glass-border-hover": "rgba(168, 85, 247, 0.5)",
        "priority-low": "#06b6d4",
        "priority-medium": "#f59e0b",
        "priority-high": "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
