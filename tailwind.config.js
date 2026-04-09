/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7f13ec', // 主色
          deep: '#3b0066',    // 主色深
          light: 'rgba(127, 19, 236, 0.1)', // 主色淡 (10% opacity)
        },
        background: {
          light: '#f7f6f8', // 浅色背景
          dark: '#191022',  // 深色背景
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#251a33', // 卡片深
        },
        sheet: {
          dark: '#1f162a', // 抽屉深
        },
        text: {
          primary: '#140d1b', // 主文案
          secondary: '#6b7280', // 次要文案
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'Inter', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
      }
    },
  },
  plugins: [],
}
