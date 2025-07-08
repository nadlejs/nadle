export default () => {
	return {
		name: "tailwind-plugin",
		configurePostCss(postcssOptions) {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			postcssOptions.plugins = [require("@tailwindcss/postcss")];

			return postcssOptions;
		},
		theme: {
			extend: {
				borderRadius: {
					code: "var(--ifm-code-border-radius)"
				},
				fontFamily: {
					mono: "var(--ifm-font-family-monospace)"
				},
				screens: {
					maxLg: { max: "996px" } // Custom max-width media query
				},
				colors: {
					primary: "var(--ifm-color-primary)",
					"primary-dark": "var(--ifm-color-primary-dark)",
					"primary-light": "var(--ifm-color-primary-light)",
					"primary-darker": "var(--ifm-color-primary-darker)",
					"primary-darkest": "var(--ifm-color-primary-darkest)",
					"primary-lighter": "var(--ifm-color-primary-lighter)",
					"primary-lightest": "var(--ifm-color-primary-lightest)",

					secondary: "var(--ifm-color-secondary)",
					"secondary-dark": "var(--ifm-color-secondary-dark)",
					"secondary-light": "var(--ifm-color-secondary-light)",
					"secondary-darker": "var(--ifm-color-secondary-darker)",
					"secondary-darkest": "var(--ifm-color-secondary-darkest)",
					"secondary-lighter": "var(--ifm-color-secondary-lighter)",
					"secondary-lightest": "var(--ifm-color-secondary-lightest)",

					"emphasis-100": "var(--ifm-color-emphasis-100)",
					"emphasis-700": "var(--ifm-color-emphasis-700)",
					"emphasis-900": "var(--ifm-color-emphasis-900)",

					background: "var(--ifm-background-color)",
					"pre-background": "var(--ifm-pre-background)"
				}
			}
		}
	};
};
