import { defineConfig } from "tsup";

export default defineConfig({
	dts: true,
	clean: true,
	outDir: "lib",
	format: ["esm"],
	splitting: true,
	sourcemap: true,
	target: "node20",
	tsconfig: "tsconfig.build.json",
	entry: {
		cli: "src/cli.ts",
		index: "src/index.ts",
		"run-cli": "src/run-cli.ts",
		worker: "src/core/worker.ts",
		"setup-cli": "src/setup-cli.ts",
		"import-meta-resolve": "src/core/import-meta-resolve.ts"
	}
});
