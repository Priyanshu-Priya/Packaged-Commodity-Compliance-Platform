/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gov: {
          900: '#07101B',
          850: '#0B1728',
          800: '#10223A',
          700: '#19355A',
          600: '#23497C',
          500: '#3266A8',
        },
        gold: {
          500: '#D4AF37',
          400: '#F1C40F',
          300: '#F5D76E',
        },
        verdict: {
          pass: '#10B981',
          passBg: '#064E3B',
          fail: '#EF4444',
          failBg: '#7F1D1D',
          review: '#F59E0B',
          reviewBg: '#78350F',
          na: '#64748B',
          naBg: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
