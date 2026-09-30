import { it, expect, describe } from "vitest";
import { settle, fixture, withGeneratedFixture } from "setup";

const lazyTypoConfig = `import { lazy, tasks } from "nadle";

tasks.register("build", lazy(() => ({ dependsOnn: ["nope"] })) as any);
`;

const typoConfig = `import { tasks } from "nadle";

tasks.register("build", {
	dependsOnn: ["nope"],
	totalNonsenseKey: 42
} as any);
`;

/** Exercises every key in TaskConfiguration, so a false positive on any of them fails here. */
const validConfig = `import { tasks, Inputs, Outputs } from "nadle";

tasks.register("dep");
tasks.register("build", {
	group: "Build",
	retries: 0,
	timeout: 60000,
	workingDir: ".",
	dependsOn: ["dep"],
	maxCacheEntries: 3,
	env: { FOO: "bar" },
	description: "Builds it",
	inputs: [Inputs.files("src/**/*.txt")],
	outputs: [Outputs.dirs("lib")]
});
`;

describe.concurrent("unknown task config keys", () => {
	it("warns naming the task and each unknown key", () =>
		withGeneratedFixture({
			files: fixture().packageJson("unknown-task-config-key").configRaw(typoConfig).build(),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`build`);
				const output = stdout + stderr;

				expect(exitCode).toBe(0);
				expect(output).toContain("build");
				expect(output).toContain("dependsOnn");
				expect(output).toContain("totalNonsenseKey");
				expect(output).toContain("unknown configuration key");
				expect(output).toContain("Did you mean");
				expect(output).toContain("dependsOn");
			}
		}));

	it("warns for an unknown key inside a lazy spec", () =>
		withGeneratedFixture({
			files: fixture().packageJson("unknown-task-config-key").configRaw(lazyTypoConfig).build(),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`build`);
				const output = stdout + stderr;

				expect(exitCode).toBe(0);
				expect(output).toContain("dependsOnn");
				expect(output).toContain("unknown configuration key");
			}
		}));

	it("does not warn for a fully valid configuration", () =>
		withGeneratedFixture({
			files: fixture().packageJson("unknown-task-config-key").file("src/a.txt", "a").file("lib/a.txt", "a").configRaw(validConfig).build(),
			testFn: async ({ exec }) => {
				const { stdout, stderr, exitCode } = await settle(exec`build`);
				const output = stdout + stderr;

				expect(exitCode).toBe(0);
				expect(output).not.toContain("unknown configuration key");
			}
		}));
});
