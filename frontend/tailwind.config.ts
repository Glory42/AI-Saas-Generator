/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-bg': '#13074b',
        'stone-700': '#44403C',
        'stone-500': '#78716C',
      },
      boxShadow: {
        'dark': '0 10px 25px -3px rgba(0, 0, 0, 0.5)',
        'stone': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
      }
    },
  },
  plugins: [],
}