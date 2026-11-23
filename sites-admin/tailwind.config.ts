import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          primary: '#1d4ed8', // deep blue
          hover: '#1e40af',
          subtle: '#eff6ff',
          ring: '#93c5fd',
        },
      },
    },
  },
  plugins: [],
};

export default config;

