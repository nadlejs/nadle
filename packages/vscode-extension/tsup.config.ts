import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	outDir: "lib",
	format: ["cjs"],
	target: "node22",
	external: ["vscode"],
	tsconfig: "tsconfig.json",
	entry: { extension: "src/extension.ts" },
	noExternal: ["vscode-languageclient", "vscode-languageserver-protocol", "vscode-jsonrpc", "vscode-languageserver-types"]
});
