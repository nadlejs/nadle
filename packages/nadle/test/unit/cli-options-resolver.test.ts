import { it, expect, describe } from "vitest";

import { CLIOptionsResolver } from "../../src/core/options/cli-options-resolver.js";

describe.concurrent("CLIOptionsResolver.resolve", () => {
	it("passes through tasks array", () => {
		const result = CLIOptionsResolver.resolve({ tasks: ["build", "test"] });

		expect(result.tasks).toEqual(["build", "test"]);
	});

	it("defaults tasks to empty array when missing", () => {
		const result = CLIOptionsResolver.resolve({});

		expect(result.tasks).toEqual([]);
	});

	it("renames config to configFile", () => {
		const result = CLIOptionsResolver.resolve({ tasks: [], config: "custom.ts" });

		expect(result).toHaveProperty("configFile", "custom.ts");
		expect(result).not.toHaveProperty("config");
	});

	it("renames exclude to excludedTasks", () => {
		const result = CLIOptionsResolver.resolve({ tasks: [], exclude: ["lint"] });

		expect(result).toHaveProperty("excludedTasks", ["lint"]);
		expect(result).not.toHaveProperty("exclude");
	});

	it("coerces cache to boolean", () => {
		const result = CLIOptionsResolver.resolve({ tasks: [], cache: 1 as any });

		expect(result).toHaveProperty("cache", true);
	});

	it("excludes yargs internal keys ($0, _)", () => {
		const result = CLIOptionsResolver.resolve({ tasks: [], $0: "nadle", _: ["build"] } as any);

		expect(result).not.toHaveProperty("$0");
		expect(result).not.toHaveProperty("_");
	});

	it("excludes dashed keys (keeps camelCase)", () => {
		const result = CLIOptionsResolver.resolve({
			tasks: [],
			dryRun: true,
			"dry-run": true
		} as any);

		expect(result).toHaveProperty("dryRun", true);
		expect(result).not.toHaveProperty("dry-run");
	});

	it("excludes alias keys", () => {
		const result = CLIOptionsResolver.resolve({
			tasks: [],
			c: "file.ts",
			config: "file.ts"
		} as any);

		expect(result).not.toHaveProperty("c");
		expect(result).toHaveProperty("configFile", "file.ts");
	});

	it("drops undefined config value", () => {
		const result = CLIOptionsResolver.resolve({ tasks: [], config: undefined });

		expect(result).not.toHaveProperty("configFile");
		expect(result).not.toHaveProperty("config");
	});

	it("preserves other valid options", () => {
		const result = CLIOptionsResolver.resolve({
			footer: false,
			parallel: true,
			tasks: ["build"],
			logLevel: "debug"
		} as any);

		expect(result).toMatchObject({
			footer: false,
			parallel: true,
			tasks: ["build"],
			logLevel: "debug"
		});
	});
});
