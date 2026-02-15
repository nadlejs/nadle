import { it, expect, describe } from "vitest";

import { CacheMissReason } from "../../src/core/models/cache/cache-miss-reason.js";

describe.concurrent("CacheMissReason.toString", () => {
	it("formats no-previous-cache", () => {
		expect(CacheMissReason.toString({ type: "no-previous-cache" })).toBe("No previous cache found");
	});

	it("formats input-changed", () => {
		expect(CacheMissReason.toString({ file: "src/index.ts", type: "input-changed" })).toBe("File src/index.ts was changed");
	});

	it("formats input-removed", () => {
		expect(CacheMissReason.toString({ file: "old.ts", type: "input-removed" })).toBe("File old.ts was removed");
	});

	it("formats input-added", () => {
		expect(CacheMissReason.toString({ file: "new.ts", type: "input-added" })).toBe("File new.ts was added");
	});
});

describe.concurrent("CacheMissReason.compute", () => {
	it("returns no-previous-cache when old fingerprint is undefined", () => {
		const reasons = CacheMissReason.compute(undefined, { "a.ts": "hash1" });

		expect(reasons).toEqual([{ type: "no-previous-cache" }]);
	});

	it("returns empty array when fingerprints are identical", () => {
		const fingerprint = { "a.ts": "abc", "b.ts": "def" };

		expect(CacheMissReason.compute(fingerprint, { ...fingerprint })).toEqual([]);
	});

	it("detects added files", () => {
		const reasons = CacheMissReason.compute({ "a.ts": "h1" }, { "a.ts": "h1", "b.ts": "h2" });

		expect(reasons).toEqual([{ file: "b.ts", type: "input-added" }]);
	});

	it("detects removed files", () => {
		const reasons = CacheMissReason.compute({ "a.ts": "h1", "b.ts": "h2" }, { "a.ts": "h1" });

		expect(reasons).toEqual([{ file: "b.ts", type: "input-removed" }]);
	});

	it("detects changed files", () => {
		const reasons = CacheMissReason.compute({ "a.ts": "old-hash" }, { "a.ts": "new-hash" });

		expect(reasons).toEqual([{ file: "a.ts", type: "input-changed" }]);
	});

	it("detects multiple changes at once", () => {
		const oldFp = { "keep.ts": "same", "changed.ts": "v1", "removed.ts": "v1" };
		const newFp = { "added.ts": "v1", "keep.ts": "same", "changed.ts": "v2" };
		const reasons = CacheMissReason.compute(oldFp, newFp);

		expect(reasons).toEqual(
			expect.arrayContaining([
				{ file: "added.ts", type: "input-added" },
				{ file: "removed.ts", type: "input-removed" },
				{ file: "changed.ts", type: "input-changed" }
			])
		);
		expect(reasons).toHaveLength(3);
	});
});
