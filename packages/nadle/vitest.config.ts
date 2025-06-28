import path from "node:path";

import { isCI, isWindows } from "std-env";
import { defineConfig } from "vitest/config";

export default defineConfig({
	server: {
		watch: {
			ignored: "**/__temp__/**"
		}
	},
	resolve: {
		alias: {
			setup: path.resolve(import.meta.dirname, "test/__setup__/index.js")
		}
	},
	test: {
		environment: "node",
		retry: isCI ? 5 : 2,
		fileParallelism: !isCI,
		testTimeout: isWindows ? 10000 : 5000,
		setupFiles: "./test/__setup__/vitest.ts",
		typecheck: {
			enabled: true,
			tsconfig: "./test/tsconfig.json"
		},
		resolveSnapshotPath(testPath, snapshotExtension) {
			const testDir = path.join(import.meta.dirname, "test");
			const relativePath = path.relative(testDir, testPath);

			return path.resolve(testDir, "__snapshots__", `${relativePath}${snapshotExtension}`);
		}
	}
});
