import path from "node:path";

import { isCI } from "std-env";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			setup: path.resolve(import.meta.dirname, "test/__setup__/index.js")
		}
	},
	test: {
		environment: "node",
		fileParallelism: !isCI,
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
