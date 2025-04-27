import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin-ts";
import perfectionist from "eslint-plugin-perfectionist";
import unusedImports from "eslint-plugin-unused-imports";

/** @type { import("eslint").Linter.Config[] } */
export default tsEslint.config(
	eslint.configs.recommended,
	tsEslint.configs.recommended,
	{
		ignores: ["**/lib", "**/node_modules/"]
	},
	{
		linterOptions: {
			reportUnusedDisableDirectives: "error"
		},
		plugins: {
			stylistic,
			perfectionist,
			unusedImports
		},
		languageOptions: {
			parserOptions: {
				project: ["tsconfig.eslint.json"]
			}
		},
		rules: {
			curly: "error",
			"sort-keys": "off",
			// "no-console": "error",
			"max-params": ["error", 4],
			"@typescript-eslint/no-namespace": "off",
			"unusedImports/no-unused-imports": "error",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					prefer: "type-imports",
					fixStyle: "inline-type-imports"
				}
			],
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					ignoreRestSiblings: true,
					destructuredArrayIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^error$"
				}
			],

			"perfectionist/sort-named-imports": ["error", { type: "line-length" }],
			"perfectionist/sort-objects": ["error", { type: "line-length", partitionByNewLine: true }],
			"perfectionist/sort-exports": ["error", { type: "line-length", partitionByNewLine: true }],
			"perfectionist/sort-interfaces": ["error", { type: "line-length", partitionByNewLine: true }],
			"perfectionist/sort-object-types": ["error", { type: "line-length", partitionByNewLine: true }],
			"perfectionist/sort-imports": [
				"error",
				{
					type: "line-length",
					newlinesBetween: "always",
					groups: ["side-effect", "builtin", "external", ["parent", "sibling", "index"]]
				}
			],

			"stylistic/padding-line-between-statements": [
				"error",
				{
					prev: "*",
					blankLine: "always",
					next: ["if", "while", "for", "switch", "try", "do", "return"]
				},
				{ next: "*", prev: "block-like", blankLine: "always" }
			]
		}
	}
);
