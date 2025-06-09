import { defineConfig } from "tsup";

const baseConfig = {
	clean: true,
	outDir: "lib",
	splitting: true,
	sourcemap: true,
	target: "node20",
	format: ["esm" as const],
	tsconfig: "tsconfig.build.json"
};

export default defineConfig([
	{
		...baseConfig,
		entry: { cli: "src/cli.ts", worker: "src/core/engine/worker.ts" }
	},
	{
		...baseConfig,
		dts: true,
		entry: { index: "src/index.ts" }
	}
]);
