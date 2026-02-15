import { it, expect, describe } from "vitest";

import { NadleError } from "../../src/core/utilities/nadle-error.js";

describe.concurrent("NadleError", () => {
	it("extends Error", () => {
		expect(new NadleError("test")).toBeInstanceOf(Error);
	});

	it("sets message correctly", () => {
		expect(new NadleError("something broke").message).toBe("something broke");
	});

	it("sets name to NadleError", () => {
		expect(new NadleError("test").name).toBe("NadleError");
	});

	it("defaults errorCode to 1", () => {
		expect(new NadleError("test").errorCode).toBe(1);
	});

	it("accepts custom errorCode", () => {
		expect(new NadleError("test", 42).errorCode).toBe(42);
	});

	it("can be caught as Error", () => {
		expect(() => {
			throw new NadleError("boom", 2);
		}).toThrow("boom");
	});
});
