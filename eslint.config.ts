import nadle from "@nadle/eslint-config";
import vitest from "@vitest/eslint-plugin";
import tsEslint, { type ConfigArray } from "typescript-eslint";

const configs: ConfigArray = tsEslint.config(
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
		files: ["packages/nadle/test/__fixtures__/**"],
		rules: {
			"no-restricted-imports": ["error", { patterns: ["../**/src/*"] }]
		}
	},
	{
		rules: {
			"n/no-extraneous-import": "off"
		},
		files: ["packages/nadle/test/__fixtures__/pnpm-workspaces/**/nadle.config.ts"]
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

export default configs;
