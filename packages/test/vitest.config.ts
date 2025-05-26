import path from "node:path";

import { isCI } from "std-env";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		retry: isCI ? 10 : 2,
		setupFiles: "./src/setup.ts",
		chaiConfig: {
			truncateThreshold: 0
		},
		typecheck: {
			enabled: true,
			tsconfig: "./src/tsconfig.json"
		},
		resolveSnapshotPath(testPath, snapshotExtension) {
			const testDir = path.join(import.meta.dirname, "src");
			const relativePath = path.relative(testDir, testPath);

			return path.resolve(testDir, "__snapshots__", `${relativePath}${snapshotExtension}`);
		}
	}
});
