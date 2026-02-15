import { it, expect, describe } from "vitest";

import { EnsureMap } from "../../src/core/utilities/ensure-map.js";

describe.concurrent("EnsureMap", () => {
	it("returns initialized value for missing key", () => {
		const map = new EnsureMap(() => 0);

		expect(map.get("a")).toBe(0);
	});

	it("stores and returns the initialized value on subsequent get", () => {
		const map = new EnsureMap(() => []);

		const first = map.get("key");
		const second = map.get("key");

		expect(first).toBe(second);
	});

	it("returns existing value without re-initializing", () => {
		let callCount = 0;
		const map = new EnsureMap(() => ++callCount);

		map.get("x");
		map.get("x");

		expect(callCount).toBe(1);
	});

	it("initializes different keys independently", () => {
		let counter = 0;
		const map = new EnsureMap(() => ++counter);

		expect(map.get("a")).toBe(1);
		expect(map.get("b")).toBe(2);
		expect(map.get("a")).toBe(1);
	});

	it("update applies updater to current value", () => {
		const map = new EnsureMap(() => 0);

		map.update("count", (value) => value + 5);

		expect(map.get("count")).toBe(5);
	});

	it("update returns the updated value", () => {
		const map = new EnsureMap(() => 10);

		const result = map.update("x", (value) => value * 2);

		expect(result).toBe(20);
	});

	it("update initializes missing key before updating", () => {
		const map = new EnsureMap(() => 100);

		map.update("new", (value) => value + 1);

		expect(map.get("new")).toBe(101);
	});

	it("extends Map", () => {
		expect(new EnsureMap(() => 0)).toBeInstanceOf(Map);
	});
});
