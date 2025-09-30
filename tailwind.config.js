/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/renderer/**/*.{js,ts,jsx,tsx}", "./src/renderer/index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Add semantic color overrides
        gray: {
          50: "hsl(var(--muted))",
          100: "hsl(var(--muted))",
          200: "hsl(var(--border))",
          300: "hsl(var(--muted-foreground))",
          400: "hsl(var(--muted-foreground))",
          500: "hsl(var(--muted-foreground))",
          600: "hsl(var(--foreground))",
          700: "hsl(var(--foreground))",
          800: "hsl(var(--background))",
          900: "hsl(var(--background))",
        },
        blue: {
          50: "hsl(var(--primary) / 0.1)",
          100: "hsl(var(--primary) / 0.2)",
          200: "hsl(var(--primary) / 0.3)",
          300: "hsl(var(--primary) / 0.4)",
          400: "hsl(var(--primary) / 0.5)",
          500: "hsl(var(--primary))",
          600: "hsl(var(--primary))",
          700: "hsl(var(--primary))",
          800: "hsl(var(--primary))",
          900: "hsl(var(--primary))",
        },
        green: {
          50: "hsl(var(--success-bg))",
          100: "hsl(var(--success-bg))",
          200: "hsl(var(--success-border))",
          300: "hsl(var(--success-border))",
          400: "hsl(var(--success))",
          500: "hsl(var(--success))",
          600: "hsl(var(--success))",
          700: "hsl(var(--success))",
          800: "hsl(var(--success))",
          900: "hsl(var(--success))",
        },
        yellow: {
          50: "hsl(var(--warning-bg))",
          100: "hsl(var(--warning-bg))",
          200: "hsl(var(--warning-border))",
          300: "hsl(var(--warning-border))",
          400: "hsl(var(--warning))",
          500: "hsl(var(--warning))",
          600: "hsl(var(--warning))",
          700: "hsl(var(--warning))",
          800: "hsl(var(--warning))",
          900: "hsl(var(--warning))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
