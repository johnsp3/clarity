/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Apple-inspired color palette
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F7',
          200: '#E5E5E5',
          300: '#D1D1D3',
          400: '#B8B8BA',
          500: '#9B9B9B',
          600: '#6B6B6B',
          700: '#4A4A4A',
          800: '#2E2E2E',
          900: '#000000',
        },
        blue: {
          50: 'rgba(0, 122, 255, 0.1)',
          100: 'rgba(0, 122, 255, 0.2)',
          200: 'rgba(0, 122, 255, 0.3)',
          300: 'rgba(0, 122, 255, 0.4)',
          400: 'rgba(0, 122, 255, 0.6)',
          500: '#007AFF', // Primary accent
          600: '#0056CC',
          700: '#004499',
          800: '#003366',
          900: '#002244',
        },
        green: {
          50: '#E5F6EC',
          500: '#24A148',
          600: '#1C8C3B',
        },
        yellow: {
          50: '#FFF8E1',
          500: '#F1C232',
          600: '#A57F00',
        },
        red: {
          50: '#FFEBEE',
          500: '#DA1E28',
          600: '#B81921',
        },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
        DEFAULT: '0 4px 6px rgba(0, 0, 0, 0.07)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
      },
      animation: {
        // Apple-style animations
        'apple-fade-in': 'appleFadeIn 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'apple-scale-in': 'appleScaleIn 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'apple-slide-down': 'appleSlideDown 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
      keyframes: {
        appleFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        appleScaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        appleSlideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      fontSize: {
        xs: ['12px', '18px'],
        sm: ['14px', '21px'],
        base: ['16px', '24px'],
        lg: ['18px', '27px'],
        xl: ['20px', '30px'],
        '2xl': ['24px', '32px'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 