import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	outDir: "lib",
	format: ["esm"],
	target: "node20",
	entry: ["src/cli.ts"],
	tsconfig: "tsconfig.build.json"
});
