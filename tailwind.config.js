/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        night: {
          950: '#0a0b10',
          900: '#12131a',
          800: '#1a1c24',
          700: '#2a2c36',
        },
        sunrise: {
          200: '#ffd6a3',
          300: '#ffbf73',
          400: '#ffa24a',
          500: '#ff8a2b',
        },
        teal: {
          200: '#8cf5e2',
          300: '#4fe1c7',
          400: '#24bca7',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255, 162, 74, 0.25), 0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
