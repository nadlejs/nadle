import type fixturify from "fixturify";
import { it, expect, describe } from "vitest";
import { getStderr, expectPass, withFixture, workspaceFixture } from "setup";

describe("workspaces resolve tasks", () => {
	const project: fixturify.DirJSON = workspaceFixture({
		root: { tasks: [{ name: "build" }, { name: "test" }] },
		workspaces: {
			backend: { tasks: [{ name: "build" }] },
			frontend: { tasks: [{ name: "build" }] },
			"common/api": { tasks: [{ name: "build" }] },
			"common/utils": { tasks: [{ name: "build" }] }
		}
	});

	it("should correct typo tasks", async () => {
		await withFixture({
			files: project,
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`backend:biuld biuld`);
			}
		});
	});

	it("should correct typo workspaces", async () => {
		await withFixture({
			files: project,
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expectPass(exec`fronte:build backe:biuld`);
			}
		});
	});

	it("should throw error with suggested workspaces if any 1", async () => {
		await withFixture({
			files: project,
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expect(getStderr(exec`common:u:build`)).resolves.toContain(`Workspace common:u not found. Did you mean common:api?`);
			}
		});
	});

	it("should throw error with suggested workspaces if any 2", async () => {
		await withFixture({
			files: project,
			fixtureDir: "monorepo",
			testFn: async ({ exec }) => {
				await expect(getStderr(exec`unknown:build`)).resolves.toContain(`Workspace unknown not found.`);
			}
		});
	});
});
