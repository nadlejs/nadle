import type fixturify from "fixturify";
import { it, expect, describe } from "vitest";
import { PACKAGE_JSON } from "@nadle/project-resolver";
import { getStderr, expectPass, CONFIG_FILE, withFixture, PNPM_WORKSPACE, createNadleConfig, createPackageJson, createPnpmWorkspace } from "setup";

describe("workspaces resolve tasks", () => {
	const project: fixturify.DirJSON = {
		[PNPM_WORKSPACE]: createPnpmWorkspace(),
		[PACKAGE_JSON]: createPackageJson("root"),
		[CONFIG_FILE]: createNadleConfig({
			tasks: [{ name: "build" }, { name: "test" }]
		}),

		backend: {
			[PACKAGE_JSON]: createPackageJson("backend"),
			[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build" }] })
		},
		frontend: {
			[PACKAGE_JSON]: createPackageJson("frontend"),
			[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build" }] })
		},

		common: {
			api: {
				[PACKAGE_JSON]: createPackageJson("api"),
				[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build" }] })
			},
			utils: {
				[PACKAGE_JSON]: createPackageJson("utils"),
				[CONFIG_FILE]: createNadleConfig({ tasks: [{ name: "build" }] })
			}
		}
	};

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
