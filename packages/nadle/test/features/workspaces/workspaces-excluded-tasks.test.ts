import Path from "node:path";

import { it, describe } from "vitest";
import { createExec, expectPass, withFixture, workspaceFixture } from "setup";

describe("workspaces > excluded tasks", () => {
	it("should not run excluded tasks", async () => {
		await withFixture({
			fixtureDir: "monorepo",
			testFn: async ({ cwd }) => {
				const exec = createExec({ cwd: Path.join(cwd, "packages", "one") });

				await expectPass(exec`check --exclude build`);
				await expectPass(exec`check --exclude two:build`);
				await expectPass(exec`check --exclude packages:two:build`);
			},
			files: workspaceFixture({
				root: { tasks: [{ name: "build" }], configure: { alias: { "packages/two": "two" } } },
				workspaces: {
					// Both workspaces intentionally share the package name "one".
					"packages/two": { name: "one", tasks: [{ name: "build" }, { name: "check", config: { dependsOn: ["build"] } }] },
					"packages/one": { tasks: [{ name: "build" }, { name: "check", config: { dependsOn: ["build", "two:build", "root:build"] } }] }
				}
			})
		});
	});
});
