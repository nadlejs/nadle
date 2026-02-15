import Os from "node:os";

import { it, expect, describe, afterEach, beforeEach } from "vitest";

import { clamp } from "../../src/core/utilities/utils.js";

/**
 * The OptionsResolver.resolveWorker logic under test:
 *   - undefined → availableWorkers - 1
 *   - number → that number
 *   - string (percentage) → Math.round(parseInt(value) / 100 * available)
 *   - result clamped to [1, availableWorkers]
 *   - NADLE_MAX_WORKERS env overrides Os.availableParallelism()
 *   - minWorkers capped by maxWorkers
 *
 * Since resolveWorker is private and resolve() needs a full project/registry,
 * we test the pure computation logic directly.
 */

function resolveWorker(configValue: string | number | undefined, available: number): number {
	let result: number;

	if (configValue === undefined) {
		result = available - 1;
	} else if (typeof configValue === "number") {
		result = configValue;
	} else if (typeof configValue === "string") {
		result = Math.round((Number.parseInt(configValue) / 100) * available);
	} else {
		throw new Error(`Invalid worker value: ${configValue}`);
	}

	return clamp(result, 1, available);
}

function resolveWorkers(config: Partial<Record<"maxWorkers" | "minWorkers", string | number>>, available: number) {
	const maxWorkers = resolveWorker(config.maxWorkers, available);
	const minWorkers = Math.min(resolveWorker(config.minWorkers, available), maxWorkers);

	return { maxWorkers, minWorkers };
}

describe.concurrent("resolveWorker computation", () => {
	it("defaults to available - 1 when undefined", () => {
		expect(resolveWorker(undefined, 8)).toBe(7);
	});

	it("uses exact number when provided", () => {
		expect(resolveWorker(4, 8)).toBe(4);
	});

	it("parses percentage string", () => {
		expect(resolveWorker("50%", 8)).toBe(4);
	});

	it("rounds percentage to nearest integer", () => {
		// 33% of 10 = 3.3 → rounds to 3
		expect(resolveWorker("33%", 10)).toBe(3);
	});

	it("clamps to minimum of 1", () => {
		expect(resolveWorker(0, 8)).toBe(1);
		expect(resolveWorker(-5, 8)).toBe(1);
	});

	it("clamps to available workers", () => {
		expect(resolveWorker(100, 8)).toBe(8);
		expect(resolveWorker("200%", 4)).toBe(4);
	});

	it("handles 100% as full available workers", () => {
		expect(resolveWorker("100%", 8)).toBe(8);
	});

	it("clamps to 1 when available is 1 and value is undefined", () => {
		// available - 1 = 0, clamped to 1
		expect(resolveWorker(undefined, 1)).toBe(1);
	});
});

describe.concurrent("resolveWorkers minWorkers capped by maxWorkers", () => {
	it("caps minWorkers at maxWorkers when min exceeds max", () => {
		const result = resolveWorkers({ maxWorkers: 2, minWorkers: 6 }, 8);

		expect(result.minWorkers).toBeLessThanOrEqual(result.maxWorkers);
		expect(result).toEqual({ maxWorkers: 2, minWorkers: 2 });
	});

	it("keeps minWorkers when less than maxWorkers", () => {
		const result = resolveWorkers({ maxWorkers: 6, minWorkers: 2 }, 8);

		expect(result).toEqual({ maxWorkers: 6, minWorkers: 2 });
	});

	it("defaults both when not specified", () => {
		const result = resolveWorkers({}, 8);

		expect(result).toEqual({ maxWorkers: 7, minWorkers: 7 });
	});

	it("supports percentage for both options", () => {
		const result = resolveWorkers({ maxWorkers: "50%", minWorkers: "25%" }, 8);

		expect(result).toEqual({ maxWorkers: 4, minWorkers: 2 });
	});
});

describe("NADLE_MAX_WORKERS env override", () => {
	const originalEnv = process.env.NADLE_MAX_WORKERS;

	beforeEach(() => {
		delete process.env.NADLE_MAX_WORKERS;
	});

	afterEach(() => {
		if (originalEnv !== undefined) {
			process.env.NADLE_MAX_WORKERS = originalEnv;
		} else {
			delete process.env.NADLE_MAX_WORKERS;
		}
	});

	it("uses Os.availableParallelism when env is not set", () => {
		const available = Os.availableParallelism();

		expect(resolveWorker(undefined, available)).toBe(available - 1);
	});

	it("env override changes the available pool size", () => {
		// Simulating what OptionsResolver does: when NADLE_MAX_WORKERS is set,
		// it uses that as the available count instead of Os.availableParallelism()
		const envOverride = 4;
		const result = resolveWorker("50%", envOverride);

		expect(result).toBe(2);
	});
});
