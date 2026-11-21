/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
          emerald: '#059669',
          emeraldDark: '#047857',
          ink: '#0F172A',
          muted: '#475569',
        }
      },
      letterSpacing: {
        display: '-0.03em',
        tightSub: '-0.02em',
      },
      boxShadow: {
        'floating': '0 4px 20px -2px rgba(0, 0, 0, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.08)',
        'floating-lg': '0 10px 30px -4px rgba(0, 0, 0, 0.18), 0 4px 10px -2px rgba(0, 0, 0, 0.1)',
        'soft': '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px -10px rgba(15, 23, 42, 0.08)',
        'card': '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px -4px rgba(15, 23, 42, 0.05)',
      }
    },
  },
  plugins: [],
}
