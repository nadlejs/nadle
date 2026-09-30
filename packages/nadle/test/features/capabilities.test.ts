import { it, expect, describe } from "vitest";
import { config, settle, fixture, withGeneratedFixture } from "setup";

interface Flag {
	name: string;
	type: string;
	aliases: string[];
	default?: unknown;
	choices?: string[];
	description?: string;
}

interface Capabilities {
	flags: Flag[];
	version: string;
	config: { type: string; title: string; properties: Record<string, unknown> };
	tasks: { id: string; name: string; label: string; group?: string; workspaceId: string; description?: string }[];
}

function parseCapabilities(stdout: string): Capabilities {
	// The logger prefixes a single `[log] ` before the JSON payload.
	const json = stdout.replace(/^\[log\]\s*/, "").trim();

	return JSON.parse(json) as Capabilities;
}

describe.concurrent("--capabilities", () => {
	it("emits a JSON document with version, flags, tasks, and config schema", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("capabilities-basic")
				.config(config().taskWithConfig("build", { group: "Build", description: "Build the project" }).task("test"))
				.build(),
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`--capabilities`);

				expect(exitCode).toBe(0);

				const capabilities = parseCapabilities(stdout);

				expect(typeof capabilities.version).toBe("string");
				expect(capabilities.config.title).toBe("TaskConfiguration");
				expect(Object.keys(capabilities.config.properties)).toContain("dependsOn");

				const taskLabels = capabilities.tasks.map((task) => task.name).sort();
				expect(taskLabels).toEqual(["build", "test"]);

				const build = capabilities.tasks.find((task) => task.name === "build")!;
				expect(build.group).toBe("Build");
				expect(build.description).toBe("Build the project");
			}
		}));

	it("derives the flag manifest from the CLI option definitions", () =>
		withGeneratedFixture({
			files: fixture().packageJson("capabilities-flags").config(config().task("build")).build(),
			testFn: async ({ exec }) => {
				const { stdout, exitCode } = await settle(exec`--capabilities`);

				expect(exitCode).toBe(0);

				const { flags } = parseCapabilities(stdout);
				const byName = new Map(flags.map((flag) => [flag.name, flag]));

				// Hidden flags must not leak.
				expect(byName.has("cache")).toBe(false);

				// A representative flag with an alias, a default, and a description.
				const dryRun = byName.get("dry-run")!;
				expect(dryRun.type).toBe("boolean");
				expect(dryRun.aliases).toEqual(["m"]);
				expect(dryRun.default).toBe(false);
				expect(typeof dryRun.description).toBe("string");

				// The new flag itself is part of the manifest.
				expect(byName.has("capabilities")).toBe(true);

				// An enumerated flag exposes its choices.
				const graph = byName.get("graph")!;
				expect(graph.choices).toContain("mermaid");
			}
		}));
});
