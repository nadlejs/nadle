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
	noExternal: ["vscode-languageserver", "vscode-languageserver-textdocument"]
});
