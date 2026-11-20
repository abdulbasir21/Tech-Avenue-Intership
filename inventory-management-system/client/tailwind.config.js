/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        page: '#F5F6FA',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        heading: '#111827',
        body: '#374151',
        muted: '#6B7280',
        'icon-chip': 'var(--color-primary-soft)',
        'table-alt': 'var(--color-row-tint)',
        'active-text': '#16A34A',
        'active-bg': '#E8F7EE',
        'inactive-text': '#F59E0B',
        'inactive-bg': '#FFF4E5',
        danger: '#DC2626',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(17, 24, 39, 0.05), 0 1px 2px -1px rgba(17, 24, 39, 0.04)',
      },
    },
  },
  plugins: [],
};
