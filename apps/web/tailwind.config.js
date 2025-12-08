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
        // Blockchain Game Design System Colors
        'game-bg': '#0D0D1A',
        'game-surface': '#1A1A2E',
        'game-primary': '#4B6AFF',
        'game-secondary': '#FFB64B',
        'game-accent': '#37E2D5',
        'game-text': '#FFFFFF',
        'game-text-muted': '#AAAAAA',
        'game-success': '#4CAF50',
        'game-warning': '#FFC107',
        'game-error': '#FF3B3B',
        
        // Token Rarity Colors
        'token-common': '#C0C0C0',
        'token-rare': '#4B6AFF',
        'token-epic': '#9B59B6',
        'token-legendary': '#FFD700',

        // Semantic colors for components
        border: 'rgba(75, 106, 255, 0.3)',
        input: '#1A1A2E',
        ring: '#4B6AFF',
        background: '#0D0D1A',
        foreground: '#FFFFFF',
        primary: {
          DEFAULT: '#4B6AFF',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#FFB64B',
          foreground: '#0D0D1A',
        },
        destructive: {
          DEFAULT: '#FF3B3B',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#1A1A2E',
          foreground: '#AAAAAA',
        },
        accent: {
          DEFAULT: '#37E2D5',
          foreground: '#0D0D1A',
        },
        popover: {
          DEFAULT: '#1A1A2E',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#1A1A2E',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        game: ['var(--font-orbitron)', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['4rem', { lineHeight: '1', letterSpacing: '0.05em' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '0.04em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '0.03em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        'card': '0px 4px 16px rgba(0, 0, 0, 0.5)',
        'button': '0px 2px 8px rgba(0, 0, 0, 0.3)',
        'glow-primary': '0 0 20px rgba(75, 106, 255, 0.4)',
        'glow-accent': '0 0 20px rgba(55, 226, 213, 0.4)',
        'glow-secondary': '0 0 20px rgba(255, 182, 75, 0.4)',
        'glow-legendary': '0 0 20px rgba(255, 215, 0, 0.4)',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
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
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(75, 106, 255, 0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(75, 106, 255, 0.6)" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "rgba(75, 106, 255, 0.5)" },
          "50%": { borderColor: "rgba(75, 106, 255, 1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "border-glow": "border-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
