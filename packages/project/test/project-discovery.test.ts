import Path from "node:path";

import { it, expect, describe } from "vitest";

import { discoverProject, resolveCurrentWorkspaceId } from "../src/index.js";

const repoRoot = Path.resolve(import.meta.dirname, "../../..");

describe("discoverProject", () => {
	it("should discover the nadle monorepo from the repo root", async () => {
		const project = await discoverProject(repoRoot);

		expect(project.packageManager).toBe("pnpm");
		expect(project.rootWorkspace.id).toBe("root");
		expect(project.rootWorkspace.absolutePath).toBe(repoRoot);
		expect(project.workspaces.length).toBeGreaterThan(0);
	});

	it("should discover the monorepo from a nested directory", async () => {
		const nestedDir = Path.join(repoRoot, "packages", "kernel");
		const project = await discoverProject(nestedDir);

		expect(project.packageManager).toBe("pnpm");
		expect(project.rootWorkspace.absolutePath).toBe(repoRoot);
	});

	it("should discover workspaces including kernel and nadle", async () => {
		const project = await discoverProject(repoRoot);
		const workspaceIds = project.workspaces.map((ws) => ws.packageJson.name);

		expect(workspaceIds).toContain("@nadle/kernel");
		expect(workspaceIds).toContain("nadle");
	});

	it("should resolve workspace dependencies", async () => {
		const project = await discoverProject(repoRoot);
		const nadleWorkspace = project.workspaces.find((ws) => ws.packageJson.name === "nadle");

		expect(nadleWorkspace).toBeDefined();
		expect(nadleWorkspace!.dependencies.length).toBeGreaterThan(0);
	});
});

describe("resolveCurrentWorkspaceId", () => {
	it("should resolve root when cwd is the root", async () => {
		const project = await discoverProject(repoRoot);
		const resolved = resolveCurrentWorkspaceId(project, repoRoot);

		expect(resolved.currentWorkspaceId).toBe("root");
	});

	it("should resolve nested workspace when cwd is inside it", async () => {
		const project = await discoverProject(repoRoot);
		const kernelDir = Path.join(repoRoot, "packages", "kernel");
		const resolved = resolveCurrentWorkspaceId(project, kernelDir);

		expect(resolved.currentWorkspaceId).not.toBe("root");
	});
});
