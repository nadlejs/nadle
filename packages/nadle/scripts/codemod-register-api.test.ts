import { it, expect, describe } from "vitest";

import { migrateSource } from "./codemod-register-api.js";

describe("register codemod", () => {
	it("name only — unchanged", () => {
		expect(migrateSource(`tasks.register("a");`)).toBe(`tasks.register("a");`);
	});

	it("fn shorthand — unchanged", () => {
		expect(migrateSource(`tasks.register("a", () => {});`)).toBe(`tasks.register("a", () => {});`);
	});

	it("fn + config", () => {
		expect(migrateSource(`tasks.register("a", fn).config({ group: "G", dependsOn: ["b"] });`)).toBe(
			`tasks.register("a", { run: fn, group: "G", dependsOn: ["b"] });`
		);
	});

	it("Task + options + config", () => {
		expect(migrateSource(`tasks.register("a", PnpxTask, { command: "x" }).config({ group: "G" });`)).toBe(
			`tasks.register("a", { run: PnpxTask, options: { command: "x" }, group: "G" });`
		);
	});

	it("Task + options, no config", () => {
		expect(migrateSource(`tasks.register("a", PnpxTask, { command: "x" });`)).toBe(
			`tasks.register("a", { run: PnpxTask, options: { command: "x" } });`
		);
	});

	it("name + config only (no body)", () => {
		expect(migrateSource(`tasks.register("a").config({ group: "G", dependsOn: ["b"] });`)).toBe(
			`tasks.register("a", { group: "G", dependsOn: ["b"] });`
		);
	});

	it(".config(callback) → lazy() wrapper", () => {
		const out = migrateSource(`tasks.register("a", T, {}).config(() => ({ env: { X: "y" } }));`);
		expect(out).toContain("lazy(");
		expect(out).toContain("run: T");
		expect(out).toContain(`env: { X: "y" }`);
	});

	it("idempotent — already-migrated unchanged", () => {
		const migrated = `tasks.register("a", { run: fn, group: "G" });`;
		expect(migrateSource(migrated)).toBe(migrated);
	});
});
