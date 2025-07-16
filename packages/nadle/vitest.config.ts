import Path from "node:path";

import { isCI } from "std-env";
import { defineConfig } from "vitest/config";

export default defineConfig({
	server: {
		watch: {
			ignored: "**/__temp__/**"
		}
	},
	resolve: {
		alias: {
			setup: Path.resolve(import.meta.dirname, "test/__setup__/index.js")
		}
	},
	test: {
		pool: "threads",
		testTimeout: 20000,
		retry: isCI ? 5 : 2,
		fileParallelism: !isCI,
		setupFiles: "./test/__setup__/vitest.ts",
		typecheck: {
			enabled: true,
			tsconfig: "./test/tsconfig.json"
		},
		resolveSnapshotPath(testPath, snapshotExtension) {
			const testDir = Path.join(import.meta.dirname, "test");
			const relativePath = Path.relative(testDir, testPath);

			return Path.resolve(testDir, "__snapshots__", `${relativePath}${snapshotExtension}`);
		}
	}
});
