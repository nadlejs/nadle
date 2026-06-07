import { it, expect, describe } from "vitest";

import {
	NadleError,
	TaskNotFoundError,
	ConfigurationError,
	TaskExecutionError,
	CyclicDependencyError
} from "../../src/core/utilities/nadle-error.js";

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

describe.concurrent("NadleError subclasses", () => {
	const cases = [
		{ errorCode: 2, name: "ConfigurationError", Subclass: ConfigurationError },
		{ errorCode: 3, name: "TaskNotFoundError", Subclass: TaskNotFoundError },
		{ errorCode: 4, name: "CyclicDependencyError", Subclass: CyclicDependencyError },
		{ errorCode: 1, name: "TaskExecutionError", Subclass: TaskExecutionError }
	];

	it.each(cases)("$name extends NadleError and Error", ({ Subclass }) => {
		const error = new Subclass("boom");

		expect(error).toBeInstanceOf(NadleError);
		expect(error).toBeInstanceOf(Error);
	});

	it.each(cases)("$name sets name and message", ({ name, Subclass }) => {
		const error = new Subclass("something broke");

		expect(error.name).toBe(name);
		expect(error.message).toBe("something broke");
	});

	it.each(cases)("$name has errorCode $errorCode", ({ Subclass, errorCode }) => {
		expect(new Subclass("boom").errorCode).toBe(errorCode);
	});

	it("is distinguishable via instanceof", () => {
		const error: NadleError = new TaskNotFoundError("missing");

		expect(error instanceof TaskNotFoundError).toBe(true);
		expect(error instanceof CyclicDependencyError).toBe(false);
	});
});
