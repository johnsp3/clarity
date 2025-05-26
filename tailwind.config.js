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
        // Enterprise color palette
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E7',
          300: '#D1D1D3',
          400: '#B8B8BA',
          500: '#9B9B9B',
          600: '#6B6B6B',
          700: '#4A4A4A',
          800: '#2E2E2E',
          900: '#1A1A1A',
        },
        blue: {
          50: '#E5F0FF',
          100: '#CCE1FF',
          200: '#99C3FF',
          300: '#66A5FF',
          400: '#3387FF',
          500: '#0F62FE', // Primary accent
          600: '#0043CE',
          700: '#002C9C',
          800: '#001D6C',
          900: '#001141',
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
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 2px 4px rgba(0, 0, 0, 0.06)',
        md: '0 2px 4px rgba(0, 0, 0, 0.06)',
        lg: '0 4px 6px rgba(0, 0, 0, 0.07)',
        xl: '0 8px 16px rgba(0, 0, 0, 0.08)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
      },
      animation: {
        // Remove all playful animations, keep only essential ones
        'fade-in': 'fadeIn 150ms ease-out',
        'fade-out': 'fadeOut 150ms ease-out',
        'slide-down': 'slideDown 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
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