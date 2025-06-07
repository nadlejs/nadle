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
		run: "src/run.ts",
		index: "src/index.ts",
		worker: "src/core/worker.ts",
		"import-meta-resolve": "src/core/import-meta-resolve.ts"
	}
});
