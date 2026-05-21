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
      }
    }
  },
  plugins: []
};
