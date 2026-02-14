import Os from "node:os";
import Path from "node:path";
import Crypto from "node:crypto";
import Fs from "node:fs/promises";

import objectHash from "object-hash";
import { bench, describe, afterAll, beforeAll } from "vitest";

let tempDir: string;
const filePaths: string[] = [];

/** Create temp files of ~1 KB each for hashing benchmarks. */
async function createTempFiles(count: number): Promise<void> {
	for (let i = 0; i < count; i++) {
		const filePath = Path.join(tempDir, `file-${i}.txt`);
		await Fs.writeFile(filePath, Crypto.randomBytes(1024));
		filePaths.push(filePath);
	}
}

beforeAll(async () => {
	tempDir = await Fs.mkdtemp(Path.join(Os.tmpdir(), "nadle-bench-"));
	await createTempFiles(100);
});

afterAll(async () => {
	await Fs.rm(tempDir, { force: true, recursive: true });
});

async function hashFile(filePath: string): Promise<string> {
	const content = await Fs.readFile(filePath);

	return Crypto.createHash("sha256").update(content).digest("hex");
}

function hashObject(object: object): string {
	return objectHash(object, {
		encoding: "hex",
		algorithm: "sha256",
		unorderedArrays: true,
		unorderedObjects: true
	});
}

describe("hashFile", () => {
	bench("hash 1 file", async () => {
		await hashFile(filePaths[0]);
	});

	bench("hash 10 files (sequential)", async () => {
		for (let i = 0; i < 10; i++) {
			await hashFile(filePaths[i]);
		}
	});

	bench("hash 10 files (parallel)", async () => {
		await Promise.all(filePaths.slice(0, 10).map(hashFile));
	});

	bench("hash 100 files (parallel)", async () => {
		await Promise.all(filePaths.slice(0, 100).map(hashFile));
	});
});

describe("hashObject (cache key computation)", () => {
	const smallInput = { taskId: "build", inputsFingerprints: { "src/index.ts": "abc123" } };

	const largeInput = {
		taskId: "build",
		inputsFingerprints: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`src/file-${i}.ts`, Crypto.randomBytes(32).toString("hex")]))
	};

	bench("small input (1 file)", () => {
		hashObject(smallInput);
	});

	bench("large input (100 files)", () => {
		hashObject(largeInput);
	});
});
