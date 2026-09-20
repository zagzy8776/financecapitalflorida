/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0c1b33',
          50: '#f2f5f9',
          100: '#e3e9f1',
          200: '#c5d1e1',
          300: '#9aafc8',
          400: '#6a87a8',
          500: '#4a6a8d',
          600: '#385472',
          700: '#2e445d',
          800: '#1a2d48',
          900: '#0c1b33',
          950: '#070f1c',
        },
        gold: {
          DEFAULT: '#b68a45',
          50: '#fbf7ef',
          100: '#f5edd9',
          200: '#e9d7b0',
          300: '#dbbc7e',
          400: '#c9a05a',
          500: '#b68a45',
          600: '#9c7138',
          700: '#7d5730',
          800: '#68472c',
          900: '#583c28',
        },
        brand: {
          50: '#fbf7ef',
          100: '#f5edd9',
          200: '#e9d7b0',
          300: '#dbbc7e',
          400: '#c9a05a',
          500: '#b68a45',
          600: '#9c7138',
          700: '#7d5730',
          800: '#68472c',
          900: '#583c28',
        },
        surface: {
          DEFAULT: '#f6f7f9',
          raised: '#ffffff',
          overlay: '#eef1f5',
          inverse: '#070f1c',
        },
        content: {
          primary: '#0c1b33',
          secondary: '#4a5d73',
          muted: '#7a8a9c',
          inverse: '#f8fafc',
        },
        line: {
          subtle: '#e6ebf1',
          strong: '#cfd7e3',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(12,27,51,0.04), 0 4px 12px rgba(12,27,51,0.04)',
        card: '0 1px 3px rgba(12,27,51,0.06), 0 8px 24px rgba(12,27,51,0.06)',
        elevated: '0 4px 8px rgba(12,27,51,0.06), 0 16px 40px rgba(12,27,51,0.1)',
        amber: '0 4px 14px rgba(182,138,69,0.28)',
        'amber-strong': '0 8px 24px rgba(182,138,69,0.35)',
        'nav-dark': '0 -8px 32px rgba(0,0,0,0.35)',
      },
      borderRadius: {
        control: '0.75rem',
        card: '1rem',
        panel: '1.25rem',
      },
      maxWidth: {
        content: '72rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out both',
        'fade-in': 'fadeIn 0.4s ease-out both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
