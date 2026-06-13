import { it, expect, describe } from "vitest";

import { PluginRegistry } from "../../src/core/plugins/plugin-registry.js";

const plugin = (name: string, enforce?: "pre" | "post") => ({ name, enforce, hooks: {} });

describe("PluginRegistry", () => {
	it("stores an applied plugin with its options", () => {
		const registry = new PluginRegistry();
		registry.apply(plugin("a"), { x: 1 });

		expect(registry.getApplied().map((entry) => entry.plugin.name)).toEqual(["a"]);
		expect(registry.getApplied()[0].options).toEqual({ x: 1 });
	});

	it("is a no-op when the same plugin is applied with deep-equal options", () => {
		const registry = new PluginRegistry();
		const p = plugin("a");
		registry.apply(p, { x: 1 });
		registry.apply(p, { x: 1 });

		expect(registry.getApplied()).toHaveLength(1);
	});

	it("treats key-reordered options as equal (no-op)", () => {
		const registry = new PluginRegistry();
		const p = plugin("a");
		registry.apply(p, { x: 1, y: 2 });
		registry.apply(p, { y: 2, x: 1 });

		expect(registry.getApplied()).toHaveLength(1);
	});

	it("throws when the same plugin name is applied with different options", () => {
		const registry = new PluginRegistry();
		registry.apply(plugin("a"), { x: 1 });

		expect(() => registry.apply(plugin("a"), { x: 2 })).toThrow(/already applied/);
	});

	it("orders plugins pre then normal then post, application order within each group", () => {
		const registry = new PluginRegistry();
		registry.apply(plugin("normal1"));
		registry.apply(plugin("post1", "post"));
		registry.apply(plugin("pre1", "pre"));
		registry.apply(plugin("normal2"));

		expect(registry.getOrdered().map((entry) => entry.plugin.name)).toEqual(["pre1", "normal1", "normal2", "post1"]);
	});
});
