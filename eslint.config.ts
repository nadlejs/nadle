import tsEslint from "typescript-eslint";
import nadle from "@nadle/eslint-config";
import vitest from "@vitest/eslint-plugin";

export default tsEslint.config(
	...nadle.configs.recommended,
	nadle.configs.react,
	{
		ignores: [
			"**/lib",
			"**/build",
			"**/.nadle",
			"**/__temp__",
			"**/node_modules/",
			"**/.docusaurus",
			"packages/nadle/test/__fixtures__/mixed-ts-js/nadle.config.js"
		]
	},
	{
		languageOptions: {
			parserOptions: {
				project: ["**/tsconfig.eslint.json"]
			}
		}
	},
	{
		files: ["packages/nadle/src/**"],
		rules: {
			"no-restricted-properties": [
				"error",
				{
					property: "cwd",
					object: "process",
					message: "Avoid using process.cwd()"
				},
				{
					property: "cwd",
					object: "Process",
					message: "Avoid using Process.cwd()"
				}
			]
		}
	},
	{
		rules: {
			"no-console": "off"
		},
		files: ["packages/sample-app/**", "packages/nadle/test/**", "packages/validators/**", "packages/examples/**"]
	},
	{
		files: ["packages/nadle/test/fixtures/**"],
		rules: {
			"no-restricted-imports": ["error", { patterns: ["../**/src/*"] }]
		}
	},
	{
		plugins: {
			vitest
		},
		files: ["**/test/**/*.test.ts"],
		rules: {
			...vitest.configs.recommended.rules,
			"vitest/expect-expect": [
				"error",
				{
					assertFunctionNames: ["expectPass", "expectFail", "expect"]
				}
			]
		}
	}
);
