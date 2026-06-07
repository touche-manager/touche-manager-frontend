/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        'touche': {
          navy:    '#1A1A3E',
          celeste: '#75AADB',
          gold:    '#C9A227',
          alert:   '#D94F3D',
          slate:   '#F4F5F7',
        }
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(26,26,62,0.06), 0 4px 16px rgba(26,26,62,0.04)',
        'card-hover': '0 4px 6px rgba(26,26,62,0.08), 0 12px 28px rgba(26,26,62,0.10)',
        'auth':       '0 8px 32px rgba(26,26,62,0.18), 0 2px 8px rgba(26,26,62,0.10)',
      },
      animation: {
        'fade-up':   'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':   'fadeIn 0.3s ease both',
        'slide-in':  'slideIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    }
  },
  plugins: []
};
