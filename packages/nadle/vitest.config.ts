import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			setup: path.resolve(import.meta.dirname, "test/__setup__/index.js")
		}
	},
	test: {
		maxWorkers: 1,
		isolate: false,
		environment: "node",
		fileParallelism: false,
		setupFiles: "./test/__setup__/vitest.ts",
		coverage: {
			enabled: true,
			provider: "v8"
		},
		typecheck: {
			enabled: true,
			tsconfig: "./test/tsconfig.json"
		},
		poolOptions: {
			forks: {
				maxForks: 1,
				singleFork: true // or poolOptions: { threads: { isolate: false } },
			}
		},
		resolveSnapshotPath(testPath, snapshotExtension) {
			const testDir = path.join(import.meta.dirname, "test");
			const relativePath = path.relative(testDir, testPath);

			return path.resolve(testDir, "__snapshots__", `${relativePath}${snapshotExtension}`);
		}
	}
});
