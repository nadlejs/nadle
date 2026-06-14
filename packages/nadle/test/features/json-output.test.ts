import { it, expect, describe } from "vitest";
import { exec, settle, fixture, getStdout, readConfig, withGeneratedFixture } from "setup";

const dependsOnFiles = fixture()
	.packageJson("json-graph")
	.configRaw(await readConfig("depends-on.ts"))
	.build();

const cacheableFiles = fixture()
	.packageJson("json-list")
	.configRaw(await readConfig("no-cache.ts"))
	.build();

describe("--json", () => {
	describe("--list --json", () => {
		it("emits one JSON array with the full per-task shape", async () => {
			const stdout = await getStdout(exec`--list --json`, { stripAnsi: false });
			const tasks = JSON.parse(stdout);

			expect(Array.isArray(tasks)).toBe(true);

			const hello = tasks.find((task: { name: string }) => task.name === "hello");

			expect(hello).toEqual({
				inputs: [],
				outputs: [],
				name: "hello",
				dependsOn: [],
				label: "hello",
				workspace: "root",
				group: "Greetings",
				description: "Say hello to nadle!"
			});

			const copy = tasks.find((task: { name: string }) => task.name === "copy");

			expect(copy.dependsOn).toEqual(["hello", "prepare"]);
			expect(copy.group).toBe("Utils");
		});

		it("reports declared inputs and outputs", () =>
			withGeneratedFixture({
				files: cacheableFiles,
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`--list --json`, { stripAnsi: false });
					const tasks = JSON.parse(stdout);
					const bundle = tasks.find((task: { name: string }) => task.name === "bundle");

					expect(bundle.inputs).toEqual(["file: input.txt"]);
					expect(bundle.outputs).toEqual(["dir: dist"]);
				}
			}));

		it("prints nothing but JSON (no banner or run summary)", async () => {
			const { stdout } = await settle(exec`--list --json`);

			expect(stdout).not.toContain("Welcome to Nadle");
			expect(stdout).not.toContain("RUN SUCCESSFUL");
			expect(stdout.trimStart().startsWith("[")).toBe(true);
		});
	});

	describe("--graph --json", () => {
		it("emits roots and nodes with dependencies", () =>
			withGeneratedFixture({
				files: dependsOnFiles,
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --graph --json`, { stripAnsi: false });
					const graph = JSON.parse(stdout);

					expect(graph.roots).toEqual(["root:build"]);
					expect(stdout).not.toContain("```mermaid");

					const build = graph.nodes.find((node: { id: string }) => node.id === "root:build");

					expect(build.label).toBe("build");
					expect(build.dependencies.sort()).toEqual(["root:compile", "root:test"]);
				}
			}));
	});

	describe("--dry-run --json", () => {
		it("emits an ordered execution plan", () =>
			withGeneratedFixture({
				files: dependsOnFiles,
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --dry-run --json`, { stripAnsi: false });
					const { plan } = JSON.parse(stdout);

					const ids = plan.map((entry: { id: string }) => entry.id);

					expect(ids[0]).toBe("root:node");
					expect(ids.at(-1)).toBe("root:build");
				}
			}));
	});

	describe("--list-workspaces --json", () => {
		it("emits workspace objects with parent", async () => {
			const stdout = await getStdout(exec`--list-workspaces --json`, { stripAnsi: false });
			const workspaces = JSON.parse(stdout);

			expect(workspaces).toEqual([{ label: "", id: "root", parent: null }]);
		});
	});

	describe("--explain --json", () => {
		it("emits the structured explanation of one task", () =>
			withGeneratedFixture({
				files: dependsOnFiles,
				testFn: async ({ exec }) => {
					const stdout = await getStdout(exec`build --explain compile --json`, { stripAnsi: false });
					const explanation = JSON.parse(stdout);

					expect(explanation.label).toBe("compile");
					expect(explanation.requestedDirectly).toBe(false);
					expect(explanation.dependents).toContain("build");
				}
			}));
	});
});
