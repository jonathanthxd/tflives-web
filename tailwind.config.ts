import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: ['var(--font-inter)', 'var(--font-geist-sans)', 'sans-serif'],
  			display: ['var(--font-space-grotesk)', 'var(--font-geist-sans)', 'sans-serif'],
  			mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'glow-pulse': {
  				'0%, 100%': { opacity: '0.5' },
  				'50%': { opacity: '0.9' },
  			},
  			'aurora-drift': {
  				'0%, 100%': { transform: 'translate(0, 0) scale(1)' },
  				'33%': { transform: 'translate(5%, -8%) scale(1.1)' },
  				'66%': { transform: 'translate(-4%, 5%) scale(0.95)' },
  			},
  			'shimmer-sweep': {
  				'0%': { transform: 'translateX(-150%) skewX(-12deg)' },
  				'100%': { transform: 'translateX(250%) skewX(-12deg)' },
  			},
  			'rise-in': {
  				'0%': { opacity: '0', transform: 'translateY(10px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  		},
  		animation: {
  			'glow-pulse': 'glow-pulse 6s ease-in-out infinite',
  			'aurora-drift': 'aurora-drift 16s ease-in-out infinite',
  			'aurora-drift-slow': 'aurora-drift 24s ease-in-out infinite reverse',
  			'shimmer-sweep': 'shimmer-sweep 3.5s ease-in-out infinite',
  			'rise-in': 'rise-in 0.5s ease-out both',
  		},
  		typography: () => ({
  			tfl: {
  				css: {
  					'--tw-prose-body': 'hsl(var(--foreground) / 0.85)',
  					'--tw-prose-headings': 'hsl(var(--foreground))',
  					'--tw-prose-lead': 'hsl(var(--muted-foreground))',
  					'--tw-prose-links': 'hsl(var(--primary))',
  					'--tw-prose-bold': 'hsl(var(--foreground))',
  					'--tw-prose-counters': 'hsl(var(--muted-foreground))',
  					'--tw-prose-bullets': 'hsl(var(--primary) / 0.4)',
  					'--tw-prose-hr': 'hsl(var(--border))',
  					'--tw-prose-quotes': 'hsl(var(--foreground))',
  					'--tw-prose-quote-borders': 'hsl(var(--primary) / 0.35)',
  					'--tw-prose-captions': 'hsl(var(--muted-foreground))',
  					'--tw-prose-code': 'hsl(var(--primary))',
  					'--tw-prose-pre-code': 'hsl(var(--foreground))',
  					'--tw-prose-pre-bg': 'hsl(var(--card))',
  					'--tw-prose-th-borders': 'hsl(var(--border))',
  					'--tw-prose-td-borders': 'hsl(var(--border) / 0.6)',
  					maxWidth: '70ch',
  					a: {
  						fontWeight: '500',
  						textDecoration: 'none',
  						borderBottom: '1px solid hsl(var(--primary) / 0.3)',
  						transition: 'border-color 0.2s ease',
  					},
  					'a:hover': {
  						borderBottomColor: 'hsl(var(--primary))',
  					},
  					'h1, h2, h3, h4': {
  						fontFamily: 'var(--font-space-grotesk)',
  						fontWeight: '600',
  						letterSpacing: '-0.01em',
  					},
  					code: {
  						backgroundColor: 'hsl(var(--primary) / 0.08)',
  						padding: '0.2em 0.45em',
  						borderRadius: '0.375rem',
  						fontWeight: '500',
  						fontFamily: 'var(--font-jetbrains-mono)',
  					},
  					'code::before': { content: 'none' },
  					'code::after': { content: 'none' },
  					pre: {
  						border: '1px solid hsl(var(--border))',
  						borderRadius: '1rem',
  						backgroundColor: 'hsl(var(--card))',
  					},
  					blockquote: {
  						fontStyle: 'normal',
  						fontWeight: '400',
  					},
  					img: {
  						borderRadius: '1rem',
  						border: '1px solid hsl(var(--border))',
  					},
  					hr: {
  						borderColor: 'hsl(var(--border))',
  					},
  				},
  			},
  		}),
  	}
  },
  plugins: [animate, typography],
};
export default config;