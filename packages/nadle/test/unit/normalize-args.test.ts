import { it, expect, describe } from "vitest";
import { normalizeArgs } from "src/builtin-tasks/run-command.js";

describe.concurrent("normalizeArgs", () => {
	it("returns an empty array for undefined", () => {
		expect(normalizeArgs(undefined)).toEqual([]);
	});

	it("splits a string into arguments", () => {
		expect(normalizeArgs("run --filter web")).toEqual(["run", "--filter", "web"]);
	});

	it("keeps escaped spaces together", () => {
		expect(normalizeArgs(`run a\\ b`)).toEqual(["run", "a b"]);
	});

	it("returns a copy of an array as-is", () => {
		expect(normalizeArgs(["a b", "c"])).toEqual(["a b", "c"]);
	});
});
