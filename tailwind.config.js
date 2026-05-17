/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.js', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: '#F5E6D3',
        sand: '#C8A96E',
        gold: '#D4B856',
        terracotta: '#E8936A',
        coral: '#D4796A',
        brown: '#A0654A',
        offwhite: '#FFF8F0',
        card: '#EDD9C0',
      },
      fontFamily: {
        'sans-light': ['DMSans_300Light'],
        sans: ['DMSans_400Regular'],
        'sans-medium': ['DMSans_500Medium'],
        'sans-semibold': ['DMSans_600SemiBold'],
        'sans-bold': ['DMSans_700Bold'],
        serif: ['DMSerifDisplay_400Regular'],
        'serif-italic': ['DMSerifDisplay_400Regular_Italic'],
      },
    },
  },
  plugins: [],
};
