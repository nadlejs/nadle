import { it, expect, describe } from "vitest";

import { MaybeArray } from "../../src/core/utilities/maybe-array.js";

describe.concurrent("MaybeArray.toArray", () => {
	it("wraps single value in an array", () => {
		expect(MaybeArray.toArray("hello")).toEqual(["hello"]);
	});

	it("returns array values unchanged", () => {
		expect(MaybeArray.toArray([1, 2, 3])).toEqual([1, 2, 3]);
	});

	it("wraps number in an array", () => {
		expect(MaybeArray.toArray(42)).toEqual([42]);
	});

	it("returns empty array unchanged", () => {
		expect(MaybeArray.toArray([])).toEqual([]);
	});

	it("wraps undefined in an array", () => {
		expect(MaybeArray.toArray(undefined)).toEqual([undefined]);
	});

	it("wraps null in an array", () => {
		expect(MaybeArray.toArray(null)).toEqual([null]);
	});
});
