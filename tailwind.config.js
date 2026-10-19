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
        space: {
          950: '#040711',
          900: '#060B16',
          850: '#0A1224',
          800: '#0F1B35',
          700: '#17284C',
        },
        sky: {
          navy: '#0A1428',
          deep: '#060C18',
          night: '#030710',
          dawn: '#161936',
          dusk: '#1A1838',
        },
        accent: {
          cyan: '#00F0FF',
          'cyan-muted': 'rgba(0, 240, 255, 0.14)',
          'cyan-glow': 'rgba(0, 240, 255, 0.3)',
          amber: '#FBBF24',
          coral: '#F43F5E',
          orange: '#FB923C',
          emerald: '#10B981',
        },
        surface: {
          base: 'rgb(var(--surface-base-rgb, 241 245 249) / <alpha-value>)',
          quiet: 'rgb(var(--surface-quiet-rgb, 255 255 255) / <alpha-value>)',
          card: 'rgb(var(--surface-card-rgb, 255 255 255) / <alpha-value>)',
          overlay: 'var(--surface-overlay)',
          border: 'var(--border-subtle)',
          divider: 'var(--divider-hairline)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
        }
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -3px rgba(0, 240, 255, 0.35)',
        'glow-amber': '0 0 25px -3px rgba(251, 191, 36, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
        'elevated': '0 12px 40px -4px rgba(0, 0, 0, 0.55)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        }
      }
    },
  },
  plugins: [],
}
