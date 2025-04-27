import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";
import reactPlugin from "eslint-plugin-react";
import functional from "eslint-plugin-functional";
import query from "@tanstack/eslint-plugin-query";
import stylistic from "@stylistic/eslint-plugin-ts";
import perfectionist from "eslint-plugin-perfectionist";
import unusedImports from "eslint-plugin-unused-imports";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname
});

/** @type { import("eslint").Linter.Config[] } */

const eslintConfig = [
	...compat.extends("next/core-web-vitals", "next/typescript"),
	...query.configs["flat/recommended"],
	{
		settings: {
			react: {
				version: "detect"
			}
		},
		plugins: {
			stylistic,
			functional,
			perfectionist,

			unusedImports: unusedImports,
			...reactPlugin.configs.flat.recommended.plugins,
			"react-hooks": reactHooksPlugin
		},
		rules: {
			...reactPlugin.configs.flat.recommended.rules,
			...reactHooksPlugin.configs.recommended.rules,
			"react/prop-types": "off",
			"react/react-in-jsx-scope": "off",
			"react/jsx-boolean-value": "error",
			"react-hooks/exhaustive-deps": "error",
			"react/jsx-curly-brace-presence": ["error", "never"],

			curly: "error",
			"sort-keys": "off",
			"no-console": "error",
			"max-params": ["error", 4],
			"@typescript-eslint/no-namespace": "off",
			"unusedImports/no-unused-imports": "error",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-empty-object-type": "off",
			"no-restricted-imports": ["error", { patterns: ["./**", "../**"] }],
			"@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "inline-type-imports" }],
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					ignoreRestSiblings: true,
					destructuredArrayIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^error$"
				}
			],

			"import/no-duplicates": ["error", { "prefer-inline": true }],

			"perfectionist/sort-jsx-props": ["error", { type: "line-length" }],
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
					groups: ["side-effect", "builtin", "external", "shadcn", "component", "project", ["parent", "sibling", "index"]],
					customGroups: {
						value: {
							project: "^@\/(?!components)",
							shadcn: "^@\/components\/shadcn\/.*",
							component: "^@\/components\/(?!shadcn).*"
						}
					}
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
	},
	{
		files: ["src/test/**"],
		rules: {
			"no-console": "off",
			"react-hooks/rules-of-hooks": "off",
			"@typescript-eslint/no-require-imports": "off",
			"import/no-extraneous-dependencies": ["error", { devDependencies: true }]
		}
	}
];

export default eslintConfig;
