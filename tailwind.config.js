/** @type {import('tailwindcss').Config} */
export default {
  // Paths resolve from this file, so the build works whichever folder it is started from.
  content: { relative: true, files: ['./index.html', './src/**/*.{js,jsx}'] },
  theme: {
    extend: {
      colors: {
        // Design system palette
        primary: {
          DEFAULT: '#1E293B', // Slate Navy
          dark: '#0F172A',
          light: '#334155', // Dark Slate
        },
        accent: {
          DEFAULT: '#0F766E', // Professional Teal
          hover: '#0D6560',
          soft: '#F0FDFA',
          border: '#99F6E4',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
        },
        ink: {
          DEFAULT: '#0F172A', // Text primary
          muted: '#475569', // Text secondary
          faint: '#94A3B8',
        },
        line: '#E2E8F0',
        field: '#CBD5E1',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        btn: '12px',
        input: '12px',
        item: '14px',
        card: '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.05)',
        lift: '0 6px 24px rgba(15, 23, 42, 0.09)',
        soft: '0 1px 3px rgba(15, 23, 42, 0.06)',
      },
      fontSize: {
        xxs: ['11px', '16px'],
      },
    },
  },
  plugins: [],
}
