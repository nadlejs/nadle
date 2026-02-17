import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	outDir: "lib",
	format: ["cjs"],
	target: "node22",
	external: ["vscode"],
	tsconfig: "tsconfig.build.json",
	entry: { extension: "src/extension.ts" }
});
