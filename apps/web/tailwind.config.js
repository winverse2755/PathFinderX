/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Celo Brand Colors
        celo: {
          yellow: "#FCFF52",
          green: "#4E632A",
          purple: "#1A0329",
          tan: {
            light: "#FBF6F1",
            medium: "#E6E3D5",
          },
          brown: "#635949",
          pink: "#F2A9E7",
          orange: "#F29E5F",
          lime: "#B2EBA1",
          blue: "#8AC0F9",
        },
        border: "#1A0329",
        input: "#E6E3D5",
        ring: "#FCFF52",
        background: "#FBF6F1",
        foreground: "#1A0329",
        primary: {
          DEFAULT: "#FCFF52",
          foreground: "#1A0329",
        },
        secondary: {
          DEFAULT: "#4E632A",
          foreground: "#FCFF52",
        },
        destructive: {
          DEFAULT: "#F29E5F",
          foreground: "#1A0329",
        },
        muted: {
          DEFAULT: "#E6E3D5",
          foreground: "#635949",
        },
        accent: {
          DEFAULT: "#F2A9E7",
          foreground: "#1A0329",
        },
        popover: {
          DEFAULT: "#FBF6F1",
          foreground: "#1A0329",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A0329",
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['4rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        none: '0',
        DEFAULT: '0',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
