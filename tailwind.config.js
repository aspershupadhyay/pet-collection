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
        canvas: 'var(--canvas)',
        page: 'var(--page)',
        well: 'var(--well)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        raised: 'var(--raised)',
        wash: {
          DEFAULT: 'var(--wash)',
          hover: 'var(--wash-hover)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          glow: 'var(--brand-glow)',
          subtle: 'var(--brand-subtle)',
        },
        surface: {
          base: 'var(--surface-base)',
          lit: 'var(--surface-lit)',
        }
      },
      fontFamily: {
        sans: ['"Funnel Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'monospace'],
        display: ['"Funnel Display"', '"Outfit"', 'sans-serif'],
        pixel: ['"Silkscreen"', 'monospace'],
      },
      fontSize: {
        micro: ['10.5px', { lineHeight: '14px', letterSpacing: '0.01em' }],
        small: ['11.5px', { lineHeight: '16px' }],
        body: ['12.5px', { lineHeight: '17px' }],
        lead: ['13.5px', { lineHeight: '18px' }],
        title: ['19px', { lineHeight: '26px' }],
      },
      maxWidth: {
        'prose-tile': '38rem',
      },
      boxShadow: {
        'tile-hover': '0 16px 36px -10px rgba(0,0,0,0.35), 0 0 0 1px var(--line-strong)',
        'glow-brand': '0 0 24px -4px var(--brand-glow)',
        float: 'var(--shadow-float)',
        stage: 'var(--shadow-stage)',
      },
      borderRadius: {
        tile: 'var(--radius-tile)',
        sheet: 'var(--radius-sheet)',
        tray: 'var(--radius-tray)',
        card: '14px',
        pill: '9999px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        float: 'float 3.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        shimmer: 'shimmer 2.2s infinite linear',
      }
    },
  },
  plugins: [],
}
