import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";

import { renderProfileReport, computeCriticalPath } from "../../src/core/reporting/profile-report.js";

// a → b → c (c depends on b depends on a); d is a cheap side branch off b.
const dependencies: Record<string, string[]> = {
	a: [],
	b: ["a"],
	c: ["b"],
	d: ["b"]
};
const durations: Record<string, number> = { c: 50, a: 100, b: 200, d: 1000 };

const critical = (roots: string[]) =>
	computeCriticalPath({
		roots,
		getLabel: (id) => id,
		getDuration: (id) => durations[id] ?? 0,
		getDependencies: (id) => dependencies[id] ?? []
	});

describe.concurrent("computeCriticalPath", () => {
	it("returns the longest cumulative-duration chain root → leaf", () => {
		// From c: a(100) → b(200) → c(50) = 350.
		expect(critical(["c"])).toEqual({ duration: 350, path: ["a", "b", "c"] });
	});

	it("picks the heavier branch across multiple roots", () => {
		// d is heavy (1000): a → b → d = 100+200+1000 = 1300, beats the c chain.
		expect(critical(["c", "d"])).toEqual({ duration: 1300, path: ["a", "b", "d"] });
	});

	it("handles a single task with no dependencies", () => {
		expect(critical(["a"])).toEqual({ path: ["a"], duration: 100 });
	});

	it("returns null when there are no roots", () => {
		expect(critical([])).toBeNull();
	});
});

describe.concurrent("renderProfileReport", () => {
	const render = (props: Parameters<typeof renderProfileReport>[0]) => stripAnsi(renderProfileReport(props));

	it("renders the critical path with an arrow chain", () => {
		const out = render({ hotspots: [], criticalPath: { duration: 350, path: ["a", "b", "c"] } });

		expect(out).toContain("Critical path");
		expect(out).toContain("a → b → c");
	});

	it("renders hotspots sorted by duration with their suggestions", () => {
		const out = render({
			criticalPath: null,
			hotspots: [
				{ duration: 10, label: "fast", suggestion: "cache missed; an input changed" },
				{ label: "slow", duration: 999, suggestion: "not cacheable; declare inputs & outputs to enable caching" }
			]
		});

		expect(out).toContain("Cache-miss hotspots");
		// slow first (higher duration), with the declare-inputs suggestion.
		expect(out.indexOf("slow")).toBeLessThan(out.indexOf("fast"));
		expect(out).toContain("declare inputs & outputs");
	});

	it("is empty when there is nothing to report", () => {
		expect(render({ hotspots: [], criticalPath: null })).toBe("");
	});
});
