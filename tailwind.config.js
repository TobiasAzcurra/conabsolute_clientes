/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			screens: {
				random: "463px",
			},
			colors: {
				"red-main": "#ff0000",
			},
			fontFamily: {
				oswald: ["Oswald", "sans-serif"],
				antonio: ["Antonio", "sans-serif"],
				kotch: ["Koch Fette Deutsche Schrift", "sans-serif"],
			},
		},
	},
	plugins: [],
};
