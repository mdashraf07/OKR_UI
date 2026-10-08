/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        header: {
          from: 'var(--color-header-from)',
          mid: 'var(--color-header-mid)',
          to: 'var(--color-header-to)',
        },
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
          active: 'var(--color-sidebar-active)',
          hover: 'var(--color-sidebar-hover)',
          text: 'var(--color-sidebar-text)',
        },
        app: {
          bg: 'var(--color-bg-app)',
          surface: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
          border: 'var(--color-border-subtle)',
          input: 'var(--color-border-input)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          pressed: 'var(--color-primary-pressed)',
          light: 'var(--color-primary-light)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        stat: {
          teal: 'var(--color-stat-teal)',
          blue: 'var(--color-stat-blue)',
          purple: 'var(--color-stat-purple)',
          coral: 'var(--color-stat-coral)',
        },
        status: {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          danger: 'var(--color-danger)',
          info: 'var(--color-info)',
        }
      },
      borderRadius: {
        card: 'var(--radius-card)',
        input: 'var(--radius-input)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        dropdown: 'var(--shadow-dropdown)',
        modal: 'var(--shadow-modal)',
      },
      transitionDuration: {
        fast: 'var(--motion-fast)',
        normal: 'var(--motion-normal)',
        slow: 'var(--motion-slow)',
      },
      transitionTimingFunction: {
        hrms: 'var(--ease-hrms)',
      }
    },
  },
  plugins: [],
}
