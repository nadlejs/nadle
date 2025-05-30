import { defineConfig } from "tsup";

export default defineConfig({
	dts: true,
	clean: true,
	outDir: "lib",
	format: ["esm"],
	splitting: true,
	sourcemap: true,
	target: "node22",
	tsconfig: "tsconfig.build.json",
	entry: { cli: "src/cli.ts", index: "src/index.ts", worker: "src/core/worker.ts" }
});
