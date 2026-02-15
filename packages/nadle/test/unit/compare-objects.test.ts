import { it, expect, describe } from "vitest";

import { compareObjects } from "../../src/core/utilities/compare-objects.js";

describe.concurrent("compareObjects", () => {
	it("returns empty array for identical objects", () => {
		expect(compareObjects({ a: 1, b: 2 }, { a: 1, b: 2 })).toEqual([]);
	});

	it("detects added entries", () => {
		const diffs = compareObjects({ a: 1 }, { a: 1, b: 2 });

		expect(diffs).toEqual([{ type: "added-entry", newEntry: { key: "b", value: 2 } }]);
	});

	it("detects removed entries", () => {
		const diffs = compareObjects({ a: 1, b: 2 }, { a: 1 });

		expect(diffs).toEqual([{ type: "removed-entry", removedEntry: { key: "b", value: 2 } }]);
	});

	it("detects changed entries", () => {
		const diffs = compareObjects({ a: 1 }, { a: 2 });

		expect(diffs).toEqual([
			{
				type: "changed-entry",
				oldEntry: { key: "a", value: 1 },
				newEntry: { key: "a", value: 2 }
			}
		]);
	});

	it("detects multiple diff types at once", () => {
		const diffs = compareObjects({ a: 1, b: 2 }, { c: 3, a: 99 });

		expect(diffs).toEqual([
			{ type: "added-entry", newEntry: { key: "c", value: 3 } },
			{ type: "removed-entry", removedEntry: { key: "b", value: 2 } },
			{ type: "changed-entry", oldEntry: { key: "a", value: 1 }, newEntry: { key: "a", value: 99 } }
		]);
	});

	it("uses custom isEqual comparator", () => {
		const diffs = compareObjects({ a: "HELLO" }, { a: "hello" }, (a, b) => a.toLowerCase() === b.toLowerCase());

		expect(diffs).toEqual([]);
	});

	it("returns empty array for two empty objects", () => {
		expect(compareObjects({}, {})).toEqual([]);
	});

	it("treats all keys as added when old object is empty", () => {
		const diffs = compareObjects({}, { x: 10, y: 20 });

		expect(diffs).toEqual([
			{ type: "added-entry", newEntry: { key: "x", value: 10 } },
			{ type: "added-entry", newEntry: { key: "y", value: 20 } }
		]);
	});

	it("treats all keys as removed when new object is empty", () => {
		const diffs = compareObjects({ x: 10, y: 20 }, {});

		expect(diffs).toEqual([
			{ type: "removed-entry", removedEntry: { key: "x", value: 10 } },
			{ type: "removed-entry", removedEntry: { key: "y", value: 20 } }
		]);
	});
});
