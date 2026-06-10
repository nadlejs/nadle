import { it, expect, describe } from "vitest";
import { CacheKey } from "src/core/models/cache/cache-key.js";

const base = { taskId: "build", inputsFingerprints: {} };

describe.concurrent("CacheKey", () => {
	it("changes when passthrough args change", async () => {
		const without = await CacheKey.compute(base);
		const withArgs = await CacheKey.compute({ ...base, passthroughArgs: ["-u"] });

		expect(withArgs).not.toBe(without);
	});

	it("changes when passthrough args values differ", async () => {
		const first = await CacheKey.compute({ ...base, passthroughArgs: ["-u"] });
		const second = await CacheKey.compute({ ...base, passthroughArgs: ["--reporter", "dot"] });

		expect(first).not.toBe(second);
	});
});
