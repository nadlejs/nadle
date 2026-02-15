import Path from "node:path";

import { it, expect, describe } from "vitest";

import { noop, clamp, capitalize, bindObject, normalizeGlobPath } from "../../src/core/utilities/utils.js";

describe.concurrent("capitalize", () => {
	it("capitalizes the first letter", () => {
		expect(capitalize("hello")).toBe("Hello");
	});

	it("returns empty string unchanged", () => {
		expect(capitalize("")).toBe("");
	});

	it("keeps already-capitalized strings unchanged", () => {
		expect(capitalize("Hello")).toBe("Hello");
	});

	it("handles single character", () => {
		expect(capitalize("a")).toBe("A");
	});

	it("does not change characters beyond the first", () => {
		expect(capitalize("hELLO")).toBe("HELLO");
	});
});

describe.concurrent("clamp", () => {
	it("returns value when within range", () => {
		expect(clamp(5, 1, 10)).toBe(5);
	});

	it("clamps to min when value is below", () => {
		expect(clamp(-3, 0, 10)).toBe(0);
	});

	it("clamps to max when value is above", () => {
		expect(clamp(15, 0, 10)).toBe(10);
	});

	it("returns min when value equals min", () => {
		expect(clamp(0, 0, 10)).toBe(0);
	});

	it("returns max when value equals max", () => {
		expect(clamp(10, 0, 10)).toBe(10);
	});

	it("handles equal min and max", () => {
		expect(clamp(5, 3, 3)).toBe(3);
	});
});

describe.concurrent("normalizeGlobPath", () => {
	it("prefixes a bare path with dot-separator", () => {
		expect(normalizeGlobPath("src/index.ts")).toBe(`.${Path.sep}src/index.ts`);
	});

	it("leaves a dot-prefixed path unchanged", () => {
		expect(normalizeGlobPath("./src/index.ts")).toBe("./src/index.ts");
	});

	it("leaves a relative dot path unchanged", () => {
		expect(normalizeGlobPath("../parent/file.ts")).toBe("../parent/file.ts");
	});
});

describe.concurrent("noop", () => {
	it("returns undefined", () => {
		expect(noop()).toBeUndefined();
	});
});

describe.concurrent("bindObject", () => {
	it("binds specified methods to the object", () => {
		const obj = {
			value: 42,
			getValue() {
				return this.value;
			},
			double() {
				return this.value * 2;
			}
		};

		const bound = bindObject(obj, ["getValue", "double"]);
		const { double, getValue } = bound;

		expect(getValue()).toBe(42);
		expect(double()).toBe(84);
	});

	it("throws when property is not a function", () => {
		const obj = { value: 42 };

		expect(() => bindObject(obj, ["value" as any])).toThrow("Property value is not a function");
	});
});
