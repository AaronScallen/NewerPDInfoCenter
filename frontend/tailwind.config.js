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
        tactical: {
          950: '#060a11',
          900: '#0b111e',
          850: '#0f172a',
          800: '#141e33',
          750: '#1a2742',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
          400: '#64748b',
          300: '#94a3b8',
          200: '#cbd5e1',
          100: '#e2e8f0',
        },
        badge: {
          gold: '#f59e0b',
          amber: '#d97706',
          bronze: '#b45309'
        },
        dispatch: {
          blue: '#0284c7',
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
          crimson: '#dc2626'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-border': 'flashBorder 0.8s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        flashBorder: {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 1)', boxShadow: '0 0 25px rgba(239, 68, 68, 0.7)' },
          '50%': { borderColor: 'rgba(239, 68, 68, 0.2)', boxShadow: '0 0 5px rgba(239, 68, 68, 0.2)' }
        }
      }
    },
  },
  plugins: [],
}
