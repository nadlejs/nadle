import { it, expect, describe } from "vitest";

import { workerRows } from "../../src/core/reporting/worker-rows.js";

describe.concurrent("workerRows", () => {
	const running = [
		{ threadId: 1, label: "build" },
		{ threadId: 4, label: "test" }
	];

	it("keeps idle rows while tasks still wait for a worker", () => {
		expect(workerRows(running, 5)).toEqual(["build", undefined, undefined, "test"]);
	});

	it("keeps only as many idle rows as tasks still wait", () => {
		expect(workerRows(running, 1)).toEqual(["build", undefined, "test"]);
	});

	it("drops every idle row once no task waits", () => {
		expect(workerRows(running, 0)).toEqual(["build", "test"]);
	});

	it("shows nothing when no task runs", () => {
		expect(workerRows([], 3)).toEqual([]);
	});
});
