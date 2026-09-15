/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F9F7F3',
        surface: '#FFFFFF',
        'surface-subtle': '#FBF9F6',
        'surface-hover': '#F5F1EB',
        ink: {
          DEFAULT: '#171A1F',
          secondary: '#5B616E',
          tertiary: '#8A8F9A',
          muted: '#A8ADB7',
        },
        border: {
          DEFAULT: '#EAE6E0',
          strong: '#D6D0C8',
          subtle: '#F0EDE8',
        },
        accent: {
          DEFAULT: '#0F766E',
          hover: '#115E59',
          light: '#E6F4F2',
          subtle: '#CCFBF1',
          dark: '#134E4A',
        },
        success: {
          DEFAULT: '#166534',
          bg: '#F0FDF4',
          border: '#BBF7D0',
          muted: '#15803D',
        },
        warning: {
          DEFAULT: '#92400E',
          bg: '#FFFBEB',
          border: '#FDE68A',
          muted: '#B45309',
        },
        danger: {
          DEFAULT: '#991B1B',
          bg: '#FEF2F2',
          border: '#FECACA',
          muted: '#B91C1C',
        },
        info: {
          DEFAULT: '#1E40AF',
          bg: '#EFF6FF',
          border: '#BFDBFE',
        },
        // Legacy compat – not used in new UI but kept to avoid breakage during transition
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
          pass: '#15803D',
          passBg: '#F0FDF4',
          fail: '#B91C1C',
          failBg: '#FEF2F2',
          review: '#B45309',
          reviewBg: '#FFFBEB',
          na: '#64748B',
          naBg: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Menlo', 'monospace'],
        display: ['Fraunces', 'Inter', 'serif'],
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
        'soft-md': '0 2px 8px -2px rgba(16, 24, 40, 0.06), 0 4px 16px -4px rgba(16, 24, 40, 0.06)',
        'soft-lg': '0 8px 24px -4px rgba(16, 24, 40, 0.08), 0 4px 8px -4px rgba(16, 24, 40, 0.04)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
