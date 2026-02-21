import { it, expect, describe } from "vitest";

import plugin from "../src/index.js";

describe("plugin meta", () => {
	it("should have correct name and version", () => {
		expect(plugin.meta.name).toBe("eslint-plugin-nadle");
		expect(plugin.meta.version).toBe("0.0.1");
	});

	it("should export all 11 rules", () => {
		expect(Object.keys(plugin.rules)).toHaveLength(11);
	});
});

describe("recommended config", () => {
	it("should scope to nadle config files", () => {
		expect(plugin.configs.recommended.files).toEqual(["**/nadle.config.*"]);
	});

	it("should include the plugin reference", () => {
		expect(plugin.configs.recommended.plugins).toHaveProperty("nadle");
	});

	it("should have 9 rules (excludes no-circular-dependencies and prefer-builtin-task)", () => {
		const rules = plugin.configs.recommended.rules!;
		expect(Object.keys(rules)).toHaveLength(9);
		expect(rules).not.toHaveProperty("nadle/no-circular-dependencies");
		expect(rules).not.toHaveProperty("nadle/prefer-builtin-task");
	});

	it("should set correctness rules to error", () => {
		const rules = plugin.configs.recommended.rules!;
		expect(rules["nadle/no-anonymous-tasks"]).toBe("error");
		expect(rules["nadle/no-duplicate-task-names"]).toBe("error");
		expect(rules["nadle/valid-task-name"]).toBe("error");
		expect(rules["nadle/valid-depends-on"]).toBe("error");
	});

	it("should set best-practice and style rules to warn", () => {
		const rules = plugin.configs.recommended.rules!;
		expect(rules["nadle/require-task-description"]).toBe("warn");
		expect(rules["nadle/require-task-inputs"]).toBe("warn");
		expect(rules["nadle/no-sync-in-task-action"]).toBe("warn");
		expect(rules["nadle/no-process-cwd"]).toBe("warn");
		expect(rules["nadle/padding-between-tasks"]).toBe("warn");
	});
});

describe("all config", () => {
	it("should scope to nadle config files", () => {
		expect(plugin.configs.all.files).toEqual(["**/nadle.config.*"]);
	});

	it("should include all 11 rules at error level", () => {
		const rules = plugin.configs.all.rules!;
		expect(Object.keys(rules)).toHaveLength(11);

		for (const level of Object.values(rules)) {
			expect(level).toBe("error");
		}
	});

	it("should include rules excluded from recommended", () => {
		const rules = plugin.configs.all.rules!;
		expect(rules["nadle/no-circular-dependencies"]).toBe("error");
		expect(rules["nadle/prefer-builtin-task"]).toBe("error");
	});
});
