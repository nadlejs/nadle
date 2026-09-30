import { it, expect, describe } from "vitest";
import { fixture, getStdout, readConfig, withGeneratedFixture } from "setup";

const dependsOnFiles = fixture()
	.packageJson("graph")
	.configRaw(await readConfig("depends-on.ts"))
	.build();

describe("--graph", () => {
	it("prints the dependency tree for a single task", () =>
		withGeneratedFixture({
			files: dependsOnFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build --graph`);

				expect(stdout).toContain("Task graph:");

				// Root plus every transitive dependency appears.
				for (const task of ["build", "test", "compile", "compileTs", "compileSvg", "install", "node"]) {
					expect(stdout).toContain(task);
				}

				// Tree connectors are present.
				expect(stdout).toMatch(/[├└]─ /);
				expect(stdout).toContain("RUN SUCCESSFUL");
			}
		}));

	it("emits a mermaid graph when --graph=mermaid", () =>
		withGeneratedFixture({
			files: dependsOnFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build --graph=mermaid`);

				expect(stdout).toContain("```mermaid");
				expect(stdout).toContain("graph TD");
				// An explicit edge uses the solid arrow.
				expect(stdout).toMatch(/-->/);
			}
		}));

	it("does not execute tasks", () =>
		withGeneratedFixture({
			files: dependsOnFiles,
			testFn: async ({ exec }) => {
				const stdout = await getStdout(exec`build --graph`);

				expect(stdout).not.toContain("STARTED");
				expect(stdout).not.toContain("DONE");
			}
		}));
});
