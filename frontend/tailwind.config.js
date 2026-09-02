/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Precise Medical Blue Token Mapping
        'med-blue': {
          DEFAULT: '#3F9BE8',
          primary: '#3F9BE8',
          dark: '#1F6FB2',
          deep: '#155A8A',
          light: '#EAF5FC',
          ultralight: '#F4FAFE',
        },
        'med-bg': {
          DEFAULT: '#FFFFFF',
          light: '#F5F9FC',
          blue: '#EAF5FC',
        },
        'med-text': {
          primary: '#1F2937',
          secondary: '#64748B',
          light: '#94A3B8',
          heading: '#163A5F',
        },
        'med-border': {
          DEFAULT: '#DCEAF4',
          light: '#E8F1F7',
        },
        'med-status': {
          success: '#22A06B',
          warning: '#F59E0B',
          error: '#DC3545',
        },
        // Backward compatibility mappings mapped strictly to Medical Blue variables
        saffron: {
          50: '#F4FAFE',
          100: '#EAF5FC',
          200: '#DCEAF4',
          300: '#84C3EE',
          400: '#5BAFEA',
          500: '#3F9BE8',
          600: '#1F6FB2',
          700: '#155A8A',
          DEFAULT: '#3F9BE8',
          light: '#3F9BE8',
          dark: '#1F6FB2',
        },
        sage: {
          50: '#F4FAFE',
          100: '#EAF5FC',
          200: '#DCEAF4',
          300: '#84C3EE',
          400: '#5BAFEA',
          500: '#1F6FB2',
          600: '#1F6FB2',
          700: '#155A8A',
          DEFAULT: '#1F6FB2',
          light: '#3F9BE8',
          dark: '#155A8A',
        },
        ivory: {
          DEFAULT: '#FFFFFF',
          50: '#FFFFFF',
          100: '#F5F9FC',
        },
        cream: {
          50: '#F4FAFE',
          100: '#EAF5FC',
          200: '#E8F1F7',
          300: '#DCEAF4',
          DEFAULT: '#EAF5FC',
        },
        amber: {
          50: '#F4FAFE',
          100: '#EAF5FC',
          200: '#DCEAF4',
          300: '#84C3EE',
          400: '#5BAFEA',
          500: '#3F9BE8',
          600: '#1F6FB2',
          DEFAULT: '#3F9BE8',
        },
        orange: {
          50: '#F4FAFE',
          100: '#EAF5FC',
          200: '#DCEAF4',
          300: '#84C3EE',
          400: '#5BAFEA',
          500: '#3F9BE8',
          600: '#1F6FB2',
          DEFAULT: '#3F9BE8',
        },
        warmgray: {
          50: '#F5F9FC',
          100: '#E8F1F7',
          200: '#DCEAF4',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1F2937',
          900: '#163A5F',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'med-sm': '0 2px 8px rgba(31, 111, 178, 0.08)',
        'med-md': '0 8px 25px rgba(31, 111, 178, 0.12)',
        'med-lg': '0 15px 40px rgba(31, 111, 178, 0.16)',
        'warm-sm': '0 2px 8px rgba(31, 111, 178, 0.08)',
        'warm': '0 4px 15px rgba(31, 111, 178, 0.06)',
        'warm-lg': '0 12px 30px rgba(31, 111, 178, 0.12)',
        'warm-xl': '0 20px 60px rgba(31, 111, 178, 0.18)',
      },
      borderRadius: {
        '2xl': '10px',
        '3xl': '16px',
      }
    },
  },
  plugins: [],
}
