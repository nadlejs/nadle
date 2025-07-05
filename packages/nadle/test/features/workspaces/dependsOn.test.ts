import Path from "node:path";

import { it, describe } from "vitest";
import { createExec, expectPass, fixturesDir } from "setup";

describe("workspaces dependsOn", () => {
	const exec = createExec({ cwd: Path.join(fixturesDir, "pnpm-workspaces") });

	it("should resolve and run dependency tasks first 1", async () => {
		await expectPass(exec`frontend:build`);
	});

	it("should resolve and run dependency tasks first 2", async () => {
		await expectPass(exec`shared:api:build --stacktrace`);
	});

	it("should resolve and run dependency tasks first 3", async () => {
		await expectPass(exec`build --stacktrace`);
	});
});
