/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0E0E1A',
        surface:  '#17172A',
        raised:   '#1F1F38',
        hover:    '#252545',
        border:   '#2A2A4A',
        purple:   '#8B5CF6',
        'purple-dark': '#6D28D9',
        'purple-soft': '#C4B5FD',
        txt:      '#EEEEFF',
        muted:    '#8888AA',
        disabled: '#44446A',
        blue:     '#60A5FA',
        green:    '#34D399',
        amber:    '#FBBF24',
        red:      '#F87171',
        gold:     '#FFD700',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'pop':        'pop 0.2s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
        'confetti':   'confettiFall 1s ease-in forwards',
        'streak':     'streakPulse 1s ease-in-out 3',
      },
      keyframes: {
        fadeIn:      { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:     { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        pop:         { '0%': { transform: 'scale(0.9)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        pulseSoft:   { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        streakPulse: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.1)' } },
        confettiFall:{ from: { transform: 'translateY(-20px)', opacity: 1 }, to: { transform: 'translateY(100vh)', opacity: 0 } },
      },
      boxShadow: {
        'glow':    '0 4px 24px rgba(139,92,246,0.18)',
        'glow-lg': '0 8px 40px rgba(139,92,246,0.30)',
        'btn':     '0 4px 16px rgba(139,92,246,0.35)',
        'fab':     '0 6px 20px rgba(139,92,246,0.50)',
      },
    },
  },
  plugins: [],
}
