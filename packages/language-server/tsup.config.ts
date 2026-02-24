import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	outDir: "lib",
	format: ["esm"],
	target: "node22",
	dts: { entry: "src/index.ts" },
	tsconfig: "tsconfig.build.json",
	entry: {
		index: "src/index.ts",
		server: "src/server.ts"
	},
	noExternal: ["vscode-languageserver", "vscode-languageserver-textdocument", "typescript", "@nadle/kernel", "@nadle/project-resolver"],
	banner: {
		js: "import { createRequire } from 'module'; import { fileURLToPath } from 'url'; import { dirname } from 'path'; const require = createRequire(import.meta.url); const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename);"
	}
});
