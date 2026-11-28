import Path from "node:path";

import { isCI } from "std-env";
import { defineConfig } from "vite-plus";
import { type PackUserConfig } from "vite-plus/pack";

function pkg(...segments: string[]): string {
	return Path.resolve(import.meta.dirname, "packages", ...segments);
}

const NADLE_FIXTURE_RULES_OFF = {
	"nadle/no-process-cwd": "off",
	"nadle/valid-task-name": "off",
	"nadle/valid-depends-on": "off",
	"nadle/no-anonymous-tasks": "off",
	"nadle/require-task-inputs": "off",
	"nadle/prefer-builtin-task": "off",
	"nadle/padding-between-tasks": "off",
	"nadle/no-sync-in-task-action": "off",
	"nadle/no-duplicate-task-names": "off",
	"nadle/no-circular-dependencies": "off",
	"nadle/require-task-description": "off"
} as const;

// tsdown would emit a .d.ts per entry plus shared type chunks, but the packages publish a single index.d.ts.
// So declarations get their own build, and the JS builds clean everything except that file.
function typesBuild(name: string, packageDir: string): PackUserConfig {
	return {
		clean: false,
		format: ["esm"],
		platform: "node",
		target: "node22",
		name: `${name}-types`,
		deps: { neverBundle: true },
		outDir: `${packageDir}/lib`,
		tsconfig: `${packageDir}/tsconfig.build.json`,
		entry: { index: `${packageDir}/src/index.ts` },
		outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
		dts: { sourcemap: false, emitDtsOnly: true, compilerOptions: { rootDir: `${packageDir}/src` } }
	};
}

function keepTypes(packageDir: string) {
	return [`${packageDir}/lib/**`, `!${packageDir}/lib/index.d.ts`];
}

export default defineConfig({
	fmt: {
		semi: true,
		useTabs: true,
		printWidth: 150,
		endOfLine: "lf",
		singleQuote: false,
		sortImports: false,
		trailingComma: "none",
		bracketSameLine: true,
		arrowParens: "always",
		// oxfmt would reorder package.json keys, clashing with the validators' field order.
		sortPackageJson: false,
		ignorePatterns: [
			"**/node_modules/**",
			"**/lib/**",
			"pnpm-lock.yaml",
			"**/index.api.md",
			"**/CHANGELOG.md",
			".claude/**",
			".specify/**",
			"docs/superpowers/**",
			// Declaration-only snippets that do not parse as TypeScript.
			"specs/**/*.ts"
		]
	},
	pack: [
		{
			dts: false,
			name: "nadle",
			format: ["esm"],
			sourcemap: false,
			target: "node22",
			platform: "node",
			// Every bare specifier stays external, as with tsup's skipNodeModulesBundle.
			deps: { neverBundle: true },
			outDir: "packages/nadle/lib",
			clean: keepTypes("packages/nadle"),
			outExtensions: () => ({ js: ".js" }),
			banner: { js: "#!/usr/bin/env node" },
			tsconfig: "packages/nadle/tsconfig.build.json",
			entry: {
				cli: "packages/nadle/src/cli.ts",
				index: "packages/nadle/src/index.ts",
				worker: "packages/nadle/src/core/engine/worker.ts"
			}
		},
		typesBuild("nadle", "packages/nadle"),
		{
			dts: false,
			format: ["esm"],
			sourcemap: false,
			target: "node22",
			platform: "node",
			name: "language-server",
			outExtensions: () => ({ js: ".js" }),
			outDir: "packages/language-server/lib",
			clean: keepTypes("packages/language-server"),
			tsconfig: "packages/language-server/tsconfig.build.json",
			entry: {
				index: "packages/language-server/src/index.ts",
				server: "packages/language-server/src/server.ts"
			},
			deps: {
				alwaysBundle: ["vscode-languageserver", "vscode-languageserver-textdocument", "typescript", "@nadle/kernel", "@nadle/project-resolver"]
			},
			banner: {
				js: "#!/usr/bin/env node\nimport { createRequire as _banner_createRequire } from 'module'; import { fileURLToPath as _banner_fileURLToPath } from 'url'; import { dirname as _banner_dirname } from 'path'; const require = _banner_createRequire(import.meta.url); const __filename = _banner_fileURLToPath(import.meta.url); const __dirname = _banner_dirname(__filename);"
			}
		},
		typesBuild("language-server", "packages/language-server"),
		{
			dts: false,
			clean: true,
			format: ["cjs"],
			sourcemap: false,
			target: "node22",
			platform: "node",
			name: "vscode-extension",
			outExtensions: () => ({ js: ".js" }),
			outDir: "packages/vscode-extension/lib",
			tsconfig: "packages/vscode-extension/tsconfig.json",
			entry: { extension: "packages/vscode-extension/src/extension.ts" },
			deps: {
				neverBundle: ["vscode"],
				alwaysBundle: ["vscode-languageclient", "vscode-languageserver-protocol", "vscode-jsonrpc", "vscode-languageserver-types"]
			}
		}
	],
	test: {
		// Files the import graph cannot see but that change what tests do (config the spawned CLI loads,
		// install state). Listed with the vitest defaults, which setting this option would otherwise replace.
		forceRerunTriggers: [
			"**/package.json",
			"**/{vitest,vite}.config.*",
			"**/pnpm-lock.yaml",
			"**/pnpm-workspace.yaml",
			"**/tsconfig*.json",
			"**/packages/nadle/test/__fixtures__/**",
			"**/packages/nadle/test/__configs__/**"
		],
		resolveSnapshotPath(testPath: string, snapshotExtension: string) {
			const testDirName = "test";
			const segments = Path.relative(import.meta.dirname, testPath).split(Path.sep);
			const testDirIndex = segments.indexOf(testDirName);
			const base = segments.slice(0, testDirIndex + 1);
			const rest = segments.slice(testDirIndex + 1);

			return Path.resolve(import.meta.dirname, ...base, "__snapshots__", `${rest.join(Path.sep)}${snapshotExtension}`);
		},
		coverage: {
			provider: "v8",
			reportsDirectory: "./coverage",
			reporter: ["text", "json-summary"],
			include: ["packages/nadle/src/**/*.ts", "packages/language-server/src/**/*.ts"],
			thresholds: {
				lines: 25,
				branches: 25,
				functions: 25,
				statements: 25
			},
			exclude: [
				"packages/nadle/src/index.ts",
				"packages/nadle/src/cli.ts",
				"packages/nadle/src/core/engine/worker.ts",
				"packages/language-server/src/index.ts",
				"packages/language-server/src/server.ts"
			]
		},
		projects: [
			{
				server: {
					watch: {
						ignored: "**/__temp__/**"
					}
				},
				resolve: {
					alias: {
						src: pkg("nadle", "src"),
						setup: pkg("nadle", "test/__setup__/index.js")
					}
				},
				test: {
					name: "nadle",
					pool: "threads",
					root: pkg("nadle"),
					testTimeout: 20000,
					retry: isCI ? 5 : 2,
					fileParallelism: !isCI,
					setupFiles: [pkg("nadle", "test/__setup__/vitest.ts")],
					globalSetup: [pkg("nadle", "test/__setup__/global-setup.ts")],
					typecheck: {
						enabled: true,
						tsconfig: pkg("nadle", "test/tsconfig.json")
					}
				}
			},
			{
				server: {
					watch: {
						ignored: "**/__temp__/**"
					}
				},
				resolve: {
					alias: {
						setup: pkg("create-nadle", "test/__setup__/index.js")
					}
				},
				test: {
					pool: "threads",
					testTimeout: 20000,
					retry: isCI ? 5 : 2,
					name: "create-nadle",
					fileParallelism: !isCI,
					root: pkg("create-nadle"),
					setupFiles: [pkg("create-nadle", "test/__setup__/vitest.ts")]
				}
			},
			{
				resolve: {
					alias: {
						src: pkg("language-server", "src")
					}
				},
				test: {
					pool: "threads",
					testTimeout: 20000,
					name: "language-server",
					root: pkg("language-server")
				}
			},
			{ test: { name: "tooling", root: Path.resolve(import.meta.dirname, "scripts") } },
			{ test: { name: "kernel", root: pkg("kernel") } },
			{ test: { name: "project-resolver", root: pkg("project-resolver") } },
			{ test: { name: "eslint-plugin", root: pkg("eslint-plugin") } }
		]
	},
	lint: {
		plugins: ["typescript", "react"],
		env: { node: true, es2024: true },
		categories: { correctness: "error" },
		options: { reportUnusedDisableDirectives: "error" },
		jsPlugins: [
			{ name: "n", specifier: "eslint-plugin-n" },
			{ name: "nadle", specifier: "eslint-plugin-nadle" },
			{ name: "stylistic", specifier: "@stylistic/eslint-plugin" },
			{ name: "perfectionist", specifier: "eslint-plugin-perfectionist" },
			{ name: "local", specifier: "./lint-rules/node-import-style.js" },
			{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }
		],
		ignorePatterns: [
			"**/lib",
			"**/build",
			"**/.nadle",
			"**/__temp__",
			"**/node_modules/",
			"**/.vitepress/dist",
			"**/.vitepress/cache",
			"specs",
			".claude/worktrees/**",
			"packages/vscode-extension/server/",
			"packages/nadle/test/__fixtures__/mixed-ts-js/nadle.config.js",
			"packages/language-server/test/__fixtures__/config.js",
			"packages/language-server/test/__fixtures__/config.mjs"
		],
		overrides: [
			{
				files: ["packages/nadle/src/**"],
				rules: {
					complexity: ["error", { max: 10 }],
					"max-params": ["error", { max: 3 }],
					"max-lines": ["error", { max: 200, skipComments: true, skipBlankLines: true }],
					"max-lines-per-function": ["error", { max: 50, skipComments: true, skipBlankLines: true }],
					"no-restricted-properties": [
						"error",
						{ property: "cwd", object: "process", message: "Avoid using process.cwd()" },
						{ property: "cwd", object: "Process", message: "Avoid using Process.cwd()" }
					]
				}
			},
			{
				rules: { "max-lines": "off" },
				// Flat declarative CLI option registry: the line-count heuristic does not fit a one-entry-per-flag list.
				files: ["packages/nadle/src/core/options/cli-options.ts"]
			},
			{
				rules: { "max-lines": "off" },
				// The core DAG engine: cohesive scheduling logic whose coupled graph state should not be split to satisfy a line count.
				files: ["packages/nadle/src/core/engine/task-scheduler.ts"]
			},
			{
				rules: { "no-console": "off" },
				files: ["packages/sample-app/**", "packages/nadle/test/**", "packages/validators/**", "packages/examples/**"]
			},
			{
				files: ["packages/nadle/test/__fixtures__/**"],
				rules: { "no-restricted-imports": ["error", { patterns: ["../**/src/*"] }] }
			},
			{
				rules: { "n/no-extraneous-import": "off" },
				files: ["packages/*/nadle.config.ts", "packages/nadle/test/__fixtures__/pnpm-workspaces/**/nadle.config.ts"]
			},
			{
				files: ["**/nadle.config.*"],
				rules: {
					"nadle/no-process-cwd": "warn",
					"nadle/valid-task-name": "error",
					"nadle/valid-depends-on": "error",
					"nadle/no-anonymous-tasks": "error",
					"nadle/require-task-inputs": "warn",
					"nadle/padding-between-tasks": "warn",
					"nadle/no-sync-in-task-action": "warn",
					"nadle/no-duplicate-task-names": "error",
					"nadle/require-task-description": "warn"
				}
			},
			{
				rules: NADLE_FIXTURE_RULES_OFF,
				files: ["packages/nadle/test/__fixtures__/**/nadle.config.*", "packages/sample-app/nadle.config.*"]
			},
			{
				rules: { "react/rules-of-hooks": "off" },
				// `use()` collides with the React `use` hook name, so the hooks rule misfires on these nadle configs.
				files: ["packages/nadle/test/__configs__/**"]
			},
			{
				files: ["packages/language-server/test/__fixtures__/**"],
				rules: { "n/no-extraneous-import": "off", "typescript/ban-ts-comment": "off" }
			},
			{
				plugins: ["vitest"],
				// The vitest rules the ESLint plugin's recommended preset enabled; oxlint's own correctness picks add more.
				files: ["**/test/**/*.test.ts"],
				rules: {
					"vitest/no-standalone-expect": "off",
					"vitest/require-to-throw-message": "off",
					"vitest/require-mock-type-parameters": "off",
					"vitest/expect-expect": ["error", { assertFunctionNames: ["expectPass", "expectFail", "expect"] }]
				}
			},
			{
				rules: { "no-restricted-imports": "off" },
				// The dynamic imports sit in generated configs that the test writes out.
				files: ["packages/nadle/test/features/only-if.test.ts"]
			}
		],
		rules: {
			curly: "error",
			"no-console": "warn",
			"typescript/no-namespace": "off",
			"max-params": ["error", { max: 4 }],
			"typescript/no-this-alias": "error",
			// The typescript-eslint recommended set, spelled out: oxlint's correctness category misses some of it.
			"typescript/ban-ts-comment": "error",
			"typescript/no-misused-new": "error",
			"typescript/no-explicit-any": "warn",
			"typescript/prefer-as-const": "error",
			"typescript/no-require-imports": "error",
			"typescript/no-empty-object-type": "off",
			"typescript/no-array-constructor": "error",
			"typescript/no-unused-expressions": "error",
			"typescript/triple-slash-reference": "error",
			"typescript/no-unsafe-function-type": "error",
			"typescript/no-wrapper-object-types": "error",
			"typescript/no-duplicate-enum-values": "error",
			"typescript/prefer-namespace-keyword": "error",
			"typescript/no-extra-non-null-assertion": "error",
			"typescript/no-unsafe-declaration-merging": "error",
			"typescript/explicit-member-accessibility": "error",
			"typescript/no-unnecessary-type-constraint": "error",
			"typescript/no-non-null-asserted-optional-chain": "error",
			"typescript/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "inline-type-imports" }],
			"no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", ignoreRestSiblings: true, destructuredArrayIgnorePattern: "^_", caughtErrorsIgnorePattern: "^error$" }
			],
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

			"n/no-process-exit": "error",
			"n/no-deprecated-api": "error",
			"n/no-exports-assign": "error",
			"n/no-missing-require": "error",
			"n/no-unpublished-bin": "error",
			"n/no-extraneous-import": "error",
			"n/prefer-node-protocol": "error",
			"n/no-extraneous-require": "error",
			"n/process-exit-as-throw": "error",
			"n/no-unpublished-require": "error",
			"n/no-unsupported-features/es-builtins": "error",
			"n/no-unsupported-features/es-syntax": ["error", { ignores: ["modules"] }],

			"perfectionist/sort-named-imports": ["error", { type: "line-length" }],
			"perfectionist/sort-objects": ["error", { type: "line-length", partitionByNewLine: true }],
			"perfectionist/sort-exports": ["error", { type: "line-length", partitionByNewLine: true }],
			"perfectionist/sort-interfaces": ["error", { type: "line-length", partitionByNewLine: true }],
			"perfectionist/sort-object-types": ["error", { type: "line-length", partitionByNewLine: true }],
			"perfectionist/sort-imports": [
				"error",
				{ newlinesBetween: 1, type: "line-length", groups: ["side-effect", "builtin", "external", ["parent", "sibling", "index"]] }
			],
			"stylistic/padding-line-between-statements": [
				"error",
				{ prev: "*", blankLine: "always", next: ["if", "while", "for", "switch", "try", "do", "return"] },
				{ next: "*", prev: "block-like", blankLine: "always" }
			],

			// New in oxlint's react correctness set; ESLint only ran the two hooks rules.
			"react/purity": "off",
			"react/rules-of-hooks": "error",
			"react/exhaustive-deps": "error",
			"react/jsx-boolean-value": "error",
			"react/jsx-curly-brace-presence": ["error", "never"],

			"local/node-import-style": "error",
			"vite-plus/prefer-vite-plus-imports": "error"
		}
	}
});
