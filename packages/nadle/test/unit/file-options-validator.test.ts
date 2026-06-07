import { it, expect, describe } from "vitest";
import { type NadleFileOptions } from "src/core/options/types.js";
import { validateFileOptions } from "src/core/options/file-options-validator.js";

// Bypass the compile-time types to simulate malformed plain-JS / runtime-computed configs.
const bad =
	(options: unknown): (() => void) =>
	() =>
		validateFileOptions(options as NadleFileOptions);

describe.concurrent("validateFileOptions", () => {
	it("accepts valid options", () => {
		expect(() =>
			validateFileOptions({
				cache: true,
				footer: false,
				minWorkers: 1,
				parallel: true,
				logLevel: "info",
				reporter: "agent",
				maxWorkers: "50%",
				maxCacheEntries: 5,
				implicitDependencies: false,
				alias: { "shared/api": "api" },
				cacheDir: "node_modules/.cache/nadle"
			})
		).not.toThrow();
	});

	it("accepts an empty options object", () => {
		expect(() => validateFileOptions({})).not.toThrow();
	});

	it("accepts a function alias", () => {
		expect(() => validateFileOptions({ alias: () => "api" })).not.toThrow();
	});

	it("rejects non-boolean booleans", () => {
		expect(bad({ cache: "yes" })).toThrowPlainMessage('Invalid value for `cache`: expected a boolean, received "yes".');
		expect(bad({ parallel: 1 })).toThrow(/Invalid value for `parallel`/);
	});

	it("rejects an invalid logLevel", () => {
		expect(bad({ logLevel: "verbose" })).toThrow(/Invalid value for `logLevel`: expected one of/);
	});

	it("rejects an invalid reporter", () => {
		expect(bad({ reporter: "json" })).toThrow(/Invalid value for `reporter`: expected one of/);
	});

	it("rejects a non-positive maxCacheEntries", () => {
		expect(bad({ maxCacheEntries: 0 })).toThrow(/Invalid value for `maxCacheEntries`/);
		expect(bad({ maxCacheEntries: -1 })).toThrow(/Invalid value for `maxCacheEntries`/);
		expect(bad({ maxCacheEntries: 1.5 })).toThrow(/Invalid value for `maxCacheEntries`/);
	});

	it("rejects an empty cacheDir", () => {
		expect(bad({ cacheDir: "" })).toThrow(/Invalid value for `cacheDir`/);
		expect(bad({ cacheDir: 1 })).toThrow(/Invalid value for `cacheDir`/);
	});

	it("rejects invalid worker values", () => {
		expect(bad({ minWorkers: 0 })).toThrow(/Invalid value for `minWorkers`/);
		expect(bad({ maxWorkers: "fast" })).toThrow(/Invalid value for `maxWorkers`/);
		expect(bad({ maxWorkers: -2 })).toThrow(/Invalid value for `maxWorkers`/);
	});

	it("accepts integer and percentage worker values", () => {
		expect(() => validateFileOptions({ minWorkers: 2, maxWorkers: "100%" })).not.toThrow();
		expect(() => validateFileOptions({ maxWorkers: "75.5%" })).not.toThrow();
	});

	it("rejects an invalid alias", () => {
		expect(bad({ alias: "api" })).toThrow(/Invalid value for `alias`/);
		expect(bad({ alias: null })).toThrow(/Invalid value for `alias`/);
	});
});
