/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#D96B27', // Primary Brand Saffron
          600: '#C2571A',
          700: '#9A3412',
          DEFAULT: '#D96B27',
          light: '#F39C12',
          dark: '#B85014',
        },
        sage: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#2E7D32', // Secondary Brand Emerald/Sage
          600: '#16A34A',
          700: '#15803D',
          DEFAULT: '#2E7D32',
          light: '#4E9F3D',
          dark: '#1B5E20',
        },
        ivory: {
          DEFAULT: '#FFFDF9',
          50: '#FFFFFE',
          100: '#FFFDF9',
        },
        cream: {
          50: '#FCF9F2',
          100: '#F9F5EE',
          200: '#F2EBDC',
          300: '#E6DCB8',
          DEFAULT: '#F9F5EE',
        },
        warmgray: {
          50: '#F9F8F6',
          100: '#F2EFEB',
          200: '#E5DFD7',
          300: '#D4CBC0',
          400: '#A89B8C',
          500: '#7D6F60',
          600: '#5C5043',
          700: '#43392F',
          800: '#2E261F',
          900: '#1C1713',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px -1px rgba(217, 107, 39, 0.06)',
        'warm': '0 4px 20px -2px rgba(217, 107, 39, 0.08)',
        'warm-lg': '0 10px 30px -4px rgba(217, 107, 39, 0.14)',
        'warm-xl': '0 20px 40px -6px rgba(217, 107, 39, 0.18)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
