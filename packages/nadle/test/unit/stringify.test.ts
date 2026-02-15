import { it, expect, describe } from "vitest";

import { stringify } from "../../src/core/utilities/stringify.js";

describe.concurrent("stringify", () => {
	it("formats object with 2-space indentation", () => {
		expect(stringify({ a: 1 })).toBe('{\n  "a": 1\n}');
	});

	it("formats nested objects", () => {
		expect(stringify({ a: { b: 2 } })).toBe('{\n  "a": {\n    "b": 2\n  }\n}');
	});

	it("formats arrays", () => {
		expect(stringify([1, 2, 3])).toBe("[\n  1,\n  2,\n  3\n]");
	});

	it("handles null", () => {
		expect(stringify(null)).toBe("null");
	});

	it("handles strings", () => {
		expect(stringify("hello")).toBe('"hello"');
	});

	it("handles numbers", () => {
		expect(stringify(42)).toBe("42");
	});

	it("handles boolean", () => {
		expect(stringify(true)).toBe("true");
	});
});
