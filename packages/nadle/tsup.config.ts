import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	outDir: "lib",
	format: ["esm"],
	splitting: true,
	sourcemap: true,
	target: "node20",
	dts: { entry: "src/index.ts" },
	tsconfig: "tsconfig.build.json",
	entry: { cli: "src/cli.ts", index: "src/index.ts", worker: "src/core/worker.ts" }
});
