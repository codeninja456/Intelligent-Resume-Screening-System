/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          550: '#0ea5e9',
          500: '#0284c7', // Slate-blue premium theme primary color
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0a324d',
        }
      }
    },
  },
  plugins: [],
}
