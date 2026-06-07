import Os from "node:os";
import Path from "node:path";
import Fs from "node:fs/promises";

import { it, expect, describe } from "vitest";

import { discoverProject, resolveCurrentWorkspaceId } from "../src/index.js";

const repoRoot = Path.resolve(import.meta.dirname, "../../..");

async function withIsolatedDir(testFn: (dir: string) => Promise<void>): Promise<void> {
	// Created under the OS temp dir so it is outside the nadle monorepo — otherwise
	// @manypkg would walk up and find the repo root instead of exercising the fallback.
	const dir = await Fs.mkdtemp(Path.join(Os.tmpdir(), "nadle-discover-"));

	try {
		await testFn(dir);
	} finally {
		await Fs.rm(dir, { force: true, recursive: true });
	}
}

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

	it("falls back to the closest package.json when there is no monorepo or nadle.root marker", async () =>
		withIsolatedDir(async (dir) => {
			const realDir = await Fs.realpath(dir);
			await Fs.writeFile(Path.join(realDir, "package.json"), JSON.stringify({ version: "1.0.0", name: "lonely-pkg" }));

			const project = await discoverProject(realDir);

			expect(project.rootWorkspace.absolutePath).toBe(realDir);
			expect(project.workspaces).toEqual([]);
			expect(project.packageManager).toBe("npm");
		}));

	it("falls back to the closest ancestor package.json from a nested directory", async () =>
		withIsolatedDir(async (dir) => {
			const realDir = await Fs.realpath(dir);
			await Fs.writeFile(Path.join(realDir, "package.json"), JSON.stringify({ version: "1.0.0", name: "lonely-pkg" }));
			const nested = Path.join(realDir, "src", "deep");
			await Fs.mkdir(nested, { recursive: true });

			const project = await discoverProject(nested);

			expect(project.rootWorkspace.absolutePath).toBe(realDir);
		}));

	it("throws when no package.json exists in any ancestor directory", async () =>
		withIsolatedDir(async (dir) => {
			const realDir = await Fs.realpath(dir);

			await expect(discoverProject(realDir)).rejects.toThrow(/Unable to locate a Nadle project root/);
		}));
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
