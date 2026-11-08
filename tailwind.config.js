/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        }
      },
      boxShadow: {
        'floating': '0 4px 20px -2px rgba(0, 0, 0, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.08)',
        'floating-lg': '0 10px 30px -4px rgba(0, 0, 0, 0.18), 0 4px 10px -2px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}

