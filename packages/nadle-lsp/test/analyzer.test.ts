import Fs from "node:fs/promises";
import Path from "node:path";

import { describe, expect, it } from "vitest";

import { analyzeDocument } from "src/analyzer.js";

const fixturesDir = Path.resolve(import.meta.dirname, "__fixtures__");

async function analyzeFixture(name: string) {
	const filePath = Path.resolve(fixturesDir, name);
	const content = await Fs.readFile(filePath, "utf-8");
	return analyzeDocument(content, name);
}

describe("analyzeDocument", () => {
	describe("valid.ts fixture", () => {
		it("finds all 7 task registrations", async () => {
			const analysis = await analyzeFixture("valid.ts");
			expect(analysis.registrations).toHaveLength(7);
		});

		it("extracts correct task names", async () => {
			const analysis = await analyzeFixture("valid.ts");
			const names = analysis.registrations.map((r) => r.name);
			expect(names).toEqual(["clean-cache", "compile", "deploy", "lint", "build", "release", "clean"]);
		});

		it("detects no-op form (1 arg)", async () => {
			const analysis = await analyzeFixture("valid.ts");
			const cleanCache = analysis.registrations[0];
			expect(cleanCache.form).toBe("no-op");
			expect(cleanCache.taskObjectName).toBeNull();
		});

		it("detects typed form (3 args) with task object name", async () => {
			const analysis = await analyzeFixture("valid.ts");
			const compile = analysis.registrations[1];
			expect(compile.form).toBe("typed");
			expect(compile.taskObjectName).toBe("ExecTask");
		});

		it("detects function form (2 args)", async () => {
			const analysis = await analyzeFixture("valid.ts");
			const deploy = analysis.registrations[2];
			expect(deploy.form).toBe("function");
			expect(deploy.taskObjectName).toBeNull();
		});

		it("extracts .config() with dependsOn array", async () => {
			const analysis = await analyzeFixture("valid.ts");
			const build = analysis.registrations[4];
			expect(build.configuration).not.toBeNull();
			expect(build.configuration!.dependsOn).toHaveLength(2);
			expect(build.configuration!.dependsOn[0].name).toBe("compile");
			expect(build.configuration!.dependsOn[1].name).toBe("lint");
		});

		it("extracts .config() with single string dependsOn", async () => {
			const analysis = await analyzeFixture("valid.ts");
			const release = analysis.registrations[5];
			expect(release.configuration).not.toBeNull();
			expect(release.configuration!.dependsOn).toHaveLength(1);
			expect(release.configuration!.dependsOn[0].name).toBe("build");
		});

		it("extracts description, group, inputs, outputs", async () => {
			const analysis = await analyzeFixture("valid.ts");
			const compile = analysis.registrations[1];
			expect(compile.configuration).not.toBeNull();
			expect(compile.configuration!.description).toBe("Compile TypeScript");
			expect(compile.configuration!.group).toBe("build");
			expect(compile.configuration!.hasInputs).toBe(true);
			expect(compile.configuration!.hasOutputs).toBe(true);
		});

		it("builds taskNames index correctly", async () => {
			const analysis = await analyzeFixture("valid.ts");
			expect(analysis.taskNames.size).toBe(7);
			expect(analysis.taskNames.has("compile")).toBe(true);
			expect(analysis.taskNames.get("compile")).toHaveLength(1);
		});
	});

	describe("invalid-names.ts fixture", () => {
		it("finds all 6 registrations with their names", async () => {
			const analysis = await analyzeFixture("invalid-names.ts");
			expect(analysis.registrations).toHaveLength(6);
			const names = analysis.registrations.map((r) => r.name);
			expect(names).toEqual(["123build", "my_task", "build-", "build task", "", "build@v2"]);
		});
	});

	describe("duplicates.ts fixture", () => {
		it("finds 3 registrations total", async () => {
			const analysis = await analyzeFixture("duplicates.ts");
			expect(analysis.registrations).toHaveLength(3);
		});

		it("indexes duplicate name with 2 entries", async () => {
			const analysis = await analyzeFixture("duplicates.ts");
			expect(analysis.taskNames.get("build")).toHaveLength(2);
			expect(analysis.taskNames.get("test")).toHaveLength(1);
		});
	});

	describe("unresolved-deps.ts fixture", () => {
		it("extracts dependsOn references", async () => {
			const analysis = await analyzeFixture("unresolved-deps.ts");
			const test = analysis.registrations.find((r) => r.name === "test");
			expect(test?.configuration?.dependsOn).toHaveLength(2);
			expect(test?.configuration?.dependsOn[0].name).toBe("compile");
			expect(test?.configuration?.dependsOn[1].name).toBe("nonexistent");
		});

		it("detects workspace-qualified dependencies", async () => {
			const analysis = await analyzeFixture("unresolved-deps.ts");
			const deploy = analysis.registrations.find((r) => r.name === "deploy");
			const wsQualified = deploy?.configuration?.dependsOn.find((d) => d.isWorkspaceQualified);
			expect(wsQualified).toBeDefined();
			expect(wsQualified!.name).toBe("other-pkg:build");
		});

		it("extracts single-string dependsOn", async () => {
			const analysis = await analyzeFixture("unresolved-deps.ts");
			const release = analysis.registrations.find((r) => r.name === "release");
			expect(release?.configuration?.dependsOn).toHaveLength(1);
			expect(release?.configuration?.dependsOn[0].name).toBe("typo-task");
		});
	});

	describe("dynamic-names.ts fixture", () => {
		it("returns null for non-literal task names", async () => {
			const analysis = await analyzeFixture("dynamic-names.ts");
			const dynamicRegs = analysis.registrations.filter((r) => r.name === null);
			expect(dynamicRegs).toHaveLength(3);
		});

		it("still extracts the literal registration", async () => {
			const analysis = await analyzeFixture("dynamic-names.ts");
			const lint = analysis.registrations.find((r) => r.name === "lint");
			expect(lint).toBeDefined();
			expect(lint!.form).toBe("typed");
		});

		it("only indexes literal names in taskNames map", async () => {
			const analysis = await analyzeFixture("dynamic-names.ts");
			expect(analysis.taskNames.size).toBe(1);
			expect(analysis.taskNames.has("lint")).toBe(true);
		});
	});

	describe("multi-format support", () => {
		it("parses .js config files", async () => {
			const analysis = await analyzeFixture("config.js");
			expect(analysis.registrations).toHaveLength(2);
			expect(analysis.taskNames.has("build")).toBe(true);
			expect(analysis.taskNames.has("test")).toBe(true);
		});

		it("parses .mjs config files", async () => {
			const analysis = await analyzeFixture("config.mjs");
			expect(analysis.registrations).toHaveLength(2);
			expect(analysis.taskNames.has("lint")).toBe(true);
		});

		it("parses .mts config files", async () => {
			const analysis = await analyzeFixture("config.mts");
			expect(analysis.registrations).toHaveLength(1);
			const compile = analysis.registrations[0];
			expect(compile.name).toBe("compile");
			expect(compile.configuration?.hasInputs).toBe(true);
			expect(compile.configuration?.hasOutputs).toBe(true);
		});
	});

	describe("range accuracy", () => {
		it("nameRange points to the string literal", async () => {
			const analysis = await analyzeFixture("valid.ts");
			const cleanCache = analysis.registrations[0];
			expect(cleanCache.nameRange.start.line).toBeGreaterThanOrEqual(0);
			expect(cleanCache.nameRange.start.character).toBeGreaterThan(0);
		});

		it("registrationRange covers the full tasks.register() call", async () => {
			const analysis = await analyzeFixture("valid.ts");
			const first = analysis.registrations[0];
			expect(first.registrationRange.start.line).toBeLessThanOrEqual(first.registrationRange.end.line);
		});
	});
});
