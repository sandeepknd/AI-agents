/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
  keyframes: {
    'fade-slide-left': {
      '0%': { opacity: 0, transform: 'translateX(-20px)' },
      '100%': { opacity: 1, transform: 'translateX(0)' },
    },
    'fade-slide-right': {
      '0%': { opacity: 0, transform: 'translateX(20px)' },
      '100%': { opacity: 1, transform: 'translateX(0)' },
    },
  },
  animation: {
    'fade-left': 'fade-slide-left 0.4s ease-out',
    'fade-right': 'fade-slide-right 0.4s ease-out',
  },
    },
  },
  plugins: [],
}


