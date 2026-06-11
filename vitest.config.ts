import Path from "node:path";

import { isCI } from "std-env";
import { defineConfig } from "vitest/config";

function pkg(...segments: string[]): string {
	return Path.resolve(import.meta.dirname, "packages", ...segments);
}

export default defineConfig({
	test: {
		resolveSnapshotPath(testPath: string, snapshotExtension: string) {
			const testDirName = "test";
			const segments = Path.relative(import.meta.dirname, testPath).split(Path.sep);
			const testDirIndex = segments.indexOf(testDirName);
			const base = segments.slice(0, testDirIndex + 1);
			const rest = segments.slice(testDirIndex + 1);

			return Path.resolve(import.meta.dirname, ...base, "__snapshots__", `${rest.join(Path.sep)}${snapshotExtension}`);
		},
		coverage: {
			provider: "v8",
			reportsDirectory: "./coverage",
			reporter: ["text", "json-summary"],
			include: ["packages/nadle/src/**/*.ts", "packages/language-server/src/**/*.ts"],
			thresholds: {
				lines: 25,
				branches: 25,
				functions: 25,
				statements: 25
			},
			exclude: [
				"packages/nadle/src/index.ts",
				"packages/nadle/src/cli.ts",
				"packages/nadle/src/core/engine/worker.ts",
				"packages/language-server/src/index.ts",
				"packages/language-server/src/server.ts"
			]
		},
		projects: [
			{
				server: {
					watch: {
						ignored: "**/__temp__/**"
					}
				},
				resolve: {
					alias: {
						src: pkg("nadle", "src"),
						setup: pkg("nadle", "test/__setup__/index.js")
					}
				},
				test: {
					name: "nadle",
					pool: "threads",
					root: pkg("nadle"),
					testTimeout: 20000,
					retry: isCI ? 5 : 2,
					fileParallelism: !isCI,
					setupFiles: [pkg("nadle", "test/__setup__/vitest.ts")],
					benchmark: {
						include: ["bench/**/*.bench.ts"]
					},
					globalSetup: [pkg("nadle", "test/__setup__/global-setup.ts")],
					typecheck: {
						enabled: true,
						tsconfig: pkg("nadle", "test/tsconfig.json")
					}
				}
			},
			{
				server: {
					watch: {
						ignored: "**/__temp__/**"
					}
				},
				resolve: {
					alias: {
						setup: pkg("create-nadle", "test/__setup__/index.js")
					}
				},
				test: {
					pool: "threads",
					testTimeout: 20000,
					retry: isCI ? 5 : 2,
					name: "create-nadle",
					fileParallelism: !isCI,
					root: pkg("create-nadle"),
					setupFiles: [pkg("create-nadle", "test/__setup__/vitest.ts")]
				}
			},
			{
				resolve: {
					alias: {
						src: pkg("language-server", "src")
					}
				},
				test: {
					pool: "threads",
					testTimeout: 20000,
					name: "language-server",
					root: pkg("language-server")
				}
			},
			{ test: { name: "kernel", root: pkg("kernel") } },
			{ test: { name: "project-resolver", root: pkg("project-resolver") } },
			{ test: { name: "eslint-plugin", root: pkg("eslint-plugin") } }
		]
	}
});
