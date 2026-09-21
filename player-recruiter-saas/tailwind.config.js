/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0d1410',
          card: '#141d17',
          lime: '#a8e600',
          'lime-hover': '#95cc00',
          dim: '#9aa89e',
          border: 'rgba(255, 255, 255, 0.08)',
          glass: 'rgba(20, 29, 23, 0.65)'
        },
        surface: '#141d17',
        'surface-dim': '#080d0a',
        'surface-bright': '#233128',
        'surface-container-lowest': '#141d17',
        'surface-container-low': '#101713',
        'surface-container': '#1a241e',
        'surface-container-high': '#232f27',
        'surface-container-highest': '#2c3a31',
        'on-surface': '#f2f4ef',
        'on-surface-variant': '#9aa89e',
        'inverse-surface': '#f2f4ef',
        'inverse-on-surface': '#0d1410',
        outline: 'rgba(255, 255, 255, 0.16)',
        'outline-variant': 'rgba(255, 255, 255, 0.08)',
        'surface-tint': '#a8e600',
        primary: '#a8e600',
        'on-primary': '#0d1410',
        'primary-container': '#a8e600',
        'on-primary-container': '#0d1410',
        'inverse-primary': '#7fb300',
        secondary: '#ffffff',
        'on-secondary': '#0d1410',
        'secondary-container': 'rgba(168, 230, 0, 0.12)',
        'on-secondary-container': '#a8e600',
        tertiary: '#ceff76',
        'on-tertiary': '#0d1410',
        'tertiary-container': '#a8e600',
        'on-tertiary-container': '#0d1410',
        error: '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',
        'primary-fixed': '#a8e600',
        'primary-fixed-dim': '#7fb300',
        'on-primary-fixed': '#0d1410',
        'on-primary-fixed-variant': '#233128',
        'secondary-fixed': '#e2e2e2',
        'secondary-fixed-dim': '#c6c6c7',
        'on-secondary-fixed': '#1a1c1c',
        'on-secondary-fixed-variant': '#454747',
        'tertiary-fixed': '#bbf550',
        'tertiary-fixed-dim': '#a1d835',
        'on-tertiary-fixed': '#131f00',
        'on-tertiary-fixed-variant': '#354e00',
        background: '#080d0a',
        'on-background': '#f2f4ef',
        'surface-variant': '#1a241e',
        'canvas-base': '#080d0a',
        'surface-card': '#141d17'
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        heading: ['"Space Grotesk"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif']
      },
      boxShadow: {
        'glow-lime': '0 0 60px -15px rgba(168, 230, 0, 0.35)',
        'phone': '0 35px 80px -20px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)'
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px"
      }
    }
  },
  plugins: []
}
