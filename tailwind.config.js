export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    blue: {
                        DEFAULT: '#0f2a4a', // Dark governance blue
                        50: '#f0f4f9',
                        100: '#e0e9f2',
                        200: '#c0d3e6',
                        300: '#90b2d3',
                        400: '#5a8cb9',
                        500: '#346d9a',
                        600: '#26557e',
                        700: '#1e4466',
                        800: '#193a54',
                        900: '#0f2a4a', // Base
                    },
                    orange: {
                        DEFAULT: '#cc5500', // Burnt orange
                        50: '#fff7ed',
                        100: '#ffedd5',
                        200: '#fed7aa',
                        300: '#fdba74',
                        400: '#fb923c',
                        500: '#f97316',
                        600: '#ea580c',
                        700: '#cc5500', // Base
                        800: '#9a3412',
                        900: '#7c2d12',
                    }
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
