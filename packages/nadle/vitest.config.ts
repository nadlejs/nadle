import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		resolveSnapshotPath(testPath, snapshotExtension) {
			const testDir = path.join(import.meta.dirname, "test");
			const relativePath = path.relative(testDir, testPath);

			return path.resolve(testDir, "__snapshots__", `${relativePath}${snapshotExtension}`);
		}
	}
});
