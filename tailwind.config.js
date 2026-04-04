/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F5F0E8',
        creamy: '#EDE8DC',
        border: '#C8C4B8',
        'border-dark': '#8A8A7A',
        ink: '#2A2A24',
        muted: '#6A6A5A',
        accent: '#E85D2A',
        'accent-hover': '#CC4A1A',
        pixel: '#4A90D9',
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
      borderRadius: {
        pixel: '2px',
      },
    },
  },
  plugins: [],
}
