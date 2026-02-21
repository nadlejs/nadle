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
			"packages/vscode-extension/server/",
			"packages/nadle/test/__fixtures__/mixed-ts-js/nadle.config.js",
			"packages/language-server/test/__fixtures__/config.js",
			"packages/language-server/test/__fixtures__/config.mjs"
		]
	},
	{
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
				projectService: {
					allowDefaultProject: ["packages/nadle/nadle.mjs", "packages/create-nadle/create-nadle.mjs", "packages/language-server/server.mjs"]
				}
			}
		}
	},
	{
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: ["consola"],
					paths: [
						{ name: "node:fs", message: "Use 'node:fs/promises' instead of 'node:fs' for promise-based APIs." },
						{ name: "consola", message: "Logging should be called via logger" }
					]
				}
			],
			"no-restricted-syntax": [
				"error",
				{
					message: "Only default imports are allowed from 'node:' modules.",
					selector: "ImportDeclaration[source.value=/^node:/] ImportSpecifier"
				},
				{
					message: "Only default imports are allowed from 'node:' modules.",
					selector: "ImportDeclaration[source.value=/^node:/] ImportNamespaceSpecifier"
				},
				{
					message: "Default imports from 'node:' modules must use PascalCase.",
					selector: "ImportDeclaration[source.value=/^node:/] ImportDefaultSpecifier[local.name=/^[a-z]/]"
				}
			]
		}
	},
	{
		files: ["packages/nadle/src/**"],
		rules: {
			complexity: ["error", { max: 10 }],
			"max-params": ["error", { max: 3 }],
			"max-lines": ["error", { max: 200, skipComments: true, skipBlankLines: true }],
			"max-lines-per-function": ["error", { max: 50, skipComments: true, skipBlankLines: true }],

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
		files: ["packages/*/nadle.config.ts", "packages/nadle/test/__fixtures__/pnpm-workspaces/**/nadle.config.ts"]
	},
	{
		files: ["packages/language-server/test/__fixtures__/**"],
		rules: {
			"n/no-extraneous-import": "off",
			"@typescript-eslint/ban-ts-comment": "off"
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

export default configs;
