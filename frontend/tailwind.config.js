/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
        sans: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        neon: {
          green: '#00ff88',
          cyan: '#00d4ff',
          red: '#ff3366',
          amber: '#ffaa00',
        },
        vault: {
          bg: '#0a0a0f',
          surface: '#0f0f1a',
          card: '#13131f',
          border: '#1e1e30',
          muted: '#2a2a40',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'blink': 'blink 1s step-end infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
        glow: { from: { boxShadow: '0 0 10px rgba(0,255,136,0.1)' }, to: { boxShadow: '0 0 25px rgba(0,255,136,0.3)' } },
      },
    },
  },
  plugins: [],
}