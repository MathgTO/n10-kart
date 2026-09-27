/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        n10: {
          lime: '#c8f542',
          limeDim: '#9bc22e',
          panel: '#121212',
          card: '#1a1a1a',
          border: '#2a2a2a',
          mute: '#a3a3a3',
          soft: '#d4d4d4',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
