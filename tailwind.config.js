/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
      },
      boxShadow: { card: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.04)' },
    },
  },
  plugins: [],
};
