import Path from "node:path";

import { it, expect, describe } from "vitest";

import { discoverProject, getAllWorkspaces, locateConfigFiles } from "../src/index.js";

const repoRoot = Path.resolve(import.meta.dirname, "../../..");

async function runCli(cwd: string) {
	const project = await locateConfigFiles(await discoverProject(cwd));

	return {
		packageManager: project.packageManager,
		projectDir: project.rootWorkspace.absolutePath,
		allConfigFiles: getAllWorkspaces(project)
			.map((ws) => ws.configFilePath)
			.filter((path): path is string => path !== null && path !== ""),
		workspaces: project.workspaces.map((ws) => ({
			id: ws.id,
			absolutePath: ws.absolutePath,
			dependencies: ws.dependencies,
			relativePath: ws.relativePath,
			configFilePath: ws.configFilePath || null
		})),
		rootWorkspace: {
			id: project.rootWorkspace.id,
			absolutePath: project.rootWorkspace.absolutePath,
			dependencies: project.rootWorkspace.dependencies,
			relativePath: project.rootWorkspace.relativePath,
			configFilePath: project.rootWorkspace.configFilePath || null
		}
	};
}

describe("nadle-project CLI", () => {
	it("should output valid data for the nadle monorepo", async () => {
		const output = await runCli(repoRoot);

		expect(output.projectDir).toBe(repoRoot);
		expect(output.packageManager).toBe("pnpm");
	});

	it("should discover root workspace", async () => {
		const output = await runCli(repoRoot);

		expect(output.rootWorkspace.id).toBe("root");
		expect(output.rootWorkspace.absolutePath).toBe(repoRoot);
	});

	it("should discover workspaces", async () => {
		const output = await runCli(repoRoot);

		expect(output.workspaces.length).toBeGreaterThan(0);

		const workspaceIds = output.workspaces.map((ws) => ws.id);
		expect(workspaceIds).toContain("packages:kernel");
	});

	it("should locate config files", async () => {
		const output = await runCli(repoRoot);

		expect(output.allConfigFiles.length).toBeGreaterThan(0);
		expect(output.allConfigFiles.some((f) => f.includes("nadle.config"))).toBe(true);
	});

	it("should locate root workspace config file", async () => {
		const output = await runCli(repoRoot);

		expect(output.rootWorkspace.configFilePath).not.toBeNull();
		expect(output.rootWorkspace.configFilePath).toContain("nadle.config");
	});

	it("should work from a nested directory", async () => {
		const nestedDir = Path.join(repoRoot, "packages", "kernel");
		const output = await runCli(nestedDir);

		expect(output.projectDir).toBe(repoRoot);
	});
});
