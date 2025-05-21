import path from "node:path";

import { isCI } from "std-env";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		retry: isCI ? 5 : 2,
		environment: "node",
		setupFiles: "./test/setup.ts",
		chaiConfig: {
			truncateThreshold: 0
		},
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
