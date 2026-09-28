/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17233b',
        canvas: '#f5f7fb',
        brand: { 50:'#f0f3ff',100:'#e2e7ff',200:'#c9d2ff',300:'#a5b3ff',400:'#7e8cff',500:'#6268f1',600:'#5050d8',700:'#4241b0',800:'#37378e',900:'#323471' }
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'], display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui'] },
      boxShadow: { card: '0 1px 2px rgba(17,24,39,.03), 0 8px 24px rgba(30,41,59,.05)', float: '0 18px 50px rgba(30,41,59,.12)' },
      borderRadius: { '2xl': '1.25rem', '3xl': '1.75rem' }
    }
  },
  plugins: []
};
