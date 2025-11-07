/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6A7B5E', // Reseda green
        'sage': '#BFAE99',
        'drab-dark-brown': '#3E3B32',
        'umber': '#6B5B53',
        'background-light': '#F5F5F5',
        'text-primary': '#4E4B3C',
        'text-secondary': '#665A48',
        'border-color': '#D3D1C7',
      },
      fontFamily: {
        display: ['Lexend', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        sans: ['Lexend', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
}
