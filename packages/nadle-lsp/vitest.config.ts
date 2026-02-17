import Path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			src: Path.resolve(import.meta.dirname, "src")
		}
	},
	test: {
		pool: "threads",
		testTimeout: 20000,
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			reportsDirectory: "./coverage",
			reporter: ["text", "json-summary"],
			exclude: ["src/index.ts", "src/server.ts"],
			thresholds: {
				lines: 25,
				branches: 25,
				functions: 25,
				statements: 25
			}
		}
	}
});
