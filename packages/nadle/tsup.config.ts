import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	outDir: "lib",
	format: ["esm"],
	target: "node22",
	dts: { entry: "src/index.ts" },
	tsconfig: "tsconfig.build.json",
	entry: { cli: "src/cli.ts", index: "src/index.ts", worker: "src/core/engine/worker.ts" }
});
