module.exports = {
	semi: true,
	useTabs: true,
	printWidth: 150,
	endOfLine: "auto",
	trailingComma: "none",
	bracketSameLine: true,
	arrowParens: "always",
	tailwindConfig: "./tailwind.config.js",
	plugins: ["prettier-plugin-tailwindcss"],
	tailwindStylesheet: "./src/app/globals.css"
};
