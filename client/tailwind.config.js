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
        dark: {
          950: '#090a0f', // Near-black background
          900: '#0f111a', // Main dark surface
          800: '#161926', // Card / Sidebar surface
          700: '#1f2436', // Elevated card / Hover surface
          600: '#2d344d', // Border / Divider
          500: '#434c6d', // Muted text / icons
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1', // Electric Indigo
          600: '#4f46e5',
          700: '#4338ca',
          glow: '#818cf8',
        },
        accent: {
          violet: '#8b5cf6',
          cyan: '#06b6d4',
          emerald: '#10b981',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
