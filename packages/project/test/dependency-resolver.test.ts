import { it, expect, describe } from "vitest";

import { type Project, type Workspace, type RootWorkspace, resolveWorkspaceDependencies } from "../src/index.js";

function createWorkspace(overrides: Partial<Workspace> & { id: string; packageJson: Workspace["packageJson"] }): Workspace {
	return {
		dependencies: [],
		label: overrides.id,
		configFilePath: null,
		relativePath: `packages/${overrides.id}`,
		absolutePath: `/root/packages/${overrides.id}`,
		...overrides
	};
}

function createProject(workspaces: Workspace[], packageManager: string): Project {
	const rootWorkspace: RootWorkspace = {
		label: "",
		id: "root",
		dependencies: [],
		relativePath: ".",
		absolutePath: "/root",
		configFilePath: "/root/nadle.config.ts",
		packageJson: { version: "1.0.0", name: "test-root" }
	};

	return { workspaces, rootWorkspace, packageManager, currentWorkspaceId: "root" };
}

describe("resolveWorkspaceDependencies", () => {
	describe("pnpm", () => {
		it("should resolve workspace: protocol dependencies", () => {
			const workspaceA = createWorkspace({
				id: "pkg-a",
				packageJson: {
					version: "1.0.0",
					name: "@test/pkg-a",
					dependencies: { "@test/pkg-b": "workspace:*" }
				}
			});
			const workspaceB = createWorkspace({
				id: "pkg-b",
				packageJson: { version: "1.0.0", name: "@test/pkg-b" }
			});
			const project = createProject([workspaceA, workspaceB], "pnpm");

			const result = resolveWorkspaceDependencies(project);

			expect(result.workspaces[0].dependencies).toEqual(["pkg-b"]);
			expect(result.workspaces[1].dependencies).toEqual([]);
		});

		it("should ignore non-workspace dependencies", () => {
			const workspace = createWorkspace({
				id: "pkg-a",
				packageJson: {
					version: "1.0.0",
					name: "@test/pkg-a",
					dependencies: { lodash: "^4.17.21" }
				}
			});
			const project = createProject([workspace], "pnpm");

			const result = resolveWorkspaceDependencies(project);

			expect(result.workspaces[0].dependencies).toEqual([]);
		});
	});

	describe("yarn", () => {
		it("should resolve workspace: protocol dependencies", () => {
			const workspaceA = createWorkspace({
				id: "pkg-a",
				packageJson: {
					version: "1.0.0",
					name: "@test/pkg-a",
					devDependencies: { "@test/pkg-b": "workspace:^" }
				}
			});
			const workspaceB = createWorkspace({
				id: "pkg-b",
				packageJson: { version: "2.0.0", name: "@test/pkg-b" }
			});
			const project = createProject([workspaceA, workspaceB], "yarn");

			const result = resolveWorkspaceDependencies(project);

			expect(result.workspaces[0].dependencies).toEqual(["pkg-b"]);
		});
	});

	describe("npm", () => {
		it("should resolve wildcard version dependencies", () => {
			const workspaceA = createWorkspace({
				id: "pkg-a",
				packageJson: {
					version: "1.0.0",
					name: "@test/pkg-a",
					dependencies: { "@test/pkg-b": "*" }
				}
			});
			const workspaceB = createWorkspace({
				id: "pkg-b",
				packageJson: { version: "2.0.0", name: "@test/pkg-b" }
			});
			const project = createProject([workspaceA, workspaceB], "npm");

			const result = resolveWorkspaceDependencies(project);

			expect(result.workspaces[0].dependencies).toEqual(["pkg-b"]);
		});

		it("should resolve exact version match dependencies", () => {
			const workspaceA = createWorkspace({
				id: "pkg-a",
				packageJson: {
					version: "1.0.0",
					name: "@test/pkg-a",
					dependencies: { "@test/pkg-b": "^2.0.0" }
				}
			});
			const workspaceB = createWorkspace({
				id: "pkg-b",
				packageJson: { version: "2.0.0", name: "@test/pkg-b" }
			});
			const project = createProject([workspaceA, workspaceB], "npm");

			const result = resolveWorkspaceDependencies(project);

			expect(result.workspaces[0].dependencies).toEqual(["pkg-b"]);
		});

		it("should not resolve non-matching version dependencies", () => {
			const workspaceA = createWorkspace({
				id: "pkg-a",
				packageJson: {
					version: "1.0.0",
					name: "@test/pkg-a",
					dependencies: { "@test/pkg-b": "^3.0.0" }
				}
			});
			const workspaceB = createWorkspace({
				id: "pkg-b",
				packageJson: { version: "2.0.0", name: "@test/pkg-b" }
			});
			const project = createProject([workspaceA, workspaceB], "npm");

			const result = resolveWorkspaceDependencies(project);

			expect(result.workspaces[0].dependencies).toEqual([]);
		});
	});

	it("should throw for unsupported package manager", () => {
		const project = createProject([], "bun");

		expect(() => resolveWorkspaceDependencies(project)).toThrow("Unsupported package manager: bun");
	});

	it("should deduplicate dependencies", () => {
		const workspaceA = createWorkspace({
			id: "pkg-a",
			packageJson: {
				version: "1.0.0",
				name: "@test/pkg-a",
				dependencies: { "@test/pkg-b": "workspace:*" },
				devDependencies: { "@test/pkg-b": "workspace:*" }
			}
		});
		const workspaceB = createWorkspace({
			id: "pkg-b",
			packageJson: { version: "1.0.0", name: "@test/pkg-b" }
		});
		const project = createProject([workspaceA, workspaceB], "pnpm");

		const result = resolveWorkspaceDependencies(project);

		expect(result.workspaces[0].dependencies).toEqual(["pkg-b"]);
	});
});
