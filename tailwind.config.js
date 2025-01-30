/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            'h1, h2, h3': {
              color: '#1a1a1a',
              fontWeight: '700',
            },
            a: {
              color: '#9333ea',
              '&:hover': {
                color: '#7e22ce',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar-hide'),
  ],
};
