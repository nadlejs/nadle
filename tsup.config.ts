import { defineConfig } from "tsup";

export default defineConfig([
	{
		clean: true,
		format: ["esm"],
		target: "node22",
		skipNodeModulesBundle: true,
		outDir: "packages/nadle/lib",
		banner: { js: "#!/usr/bin/env node" },
		tsconfig: "packages/nadle/tsconfig.build.json",
		dts: { entry: "packages/nadle/src/index.ts", compilerOptions: { rootDir: "packages/nadle/src" } },
		entry: {
			cli: "packages/nadle/src/cli.ts",
			index: "packages/nadle/src/index.ts",
			worker: "packages/nadle/src/core/engine/worker.ts"
		}
	},
	{
		clean: true,
		format: ["esm"],
		target: "node22",
		outDir: "packages/language-server/lib",
		tsconfig: "packages/language-server/tsconfig.build.json",
		entry: {
			index: "packages/language-server/src/index.ts",
			server: "packages/language-server/src/server.ts"
		},
		dts: { entry: "packages/language-server/src/index.ts", compilerOptions: { rootDir: "packages/language-server/src" } },
		noExternal: ["vscode-languageserver", "vscode-languageserver-textdocument", "typescript", "@nadle/kernel", "@nadle/project-resolver"],
		banner: {
			js: "#!/usr/bin/env node\nimport { createRequire } from 'module'; import { fileURLToPath as _banner_fileURLToPath } from 'url'; import { dirname as _banner_dirname } from 'path'; const require = createRequire(import.meta.url); const __filename = _banner_fileURLToPath(import.meta.url); const __dirname = _banner_dirname(__filename);"
		}
	},
	{
		clean: true,
		format: ["cjs"],
		target: "node22",
		external: ["vscode"],
		outExtension: () => ({ js: ".js" }),
		outDir: "packages/vscode-extension/lib",
		tsconfig: "packages/vscode-extension/tsconfig.json",
		entry: { extension: "packages/vscode-extension/src/extension.ts" },
		noExternal: ["vscode-languageclient", "vscode-languageserver-protocol", "vscode-jsonrpc", "vscode-languageserver-types"]
	}
]);
