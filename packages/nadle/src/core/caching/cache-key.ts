import Crypto from "node:crypto";
import Fs from "node:fs/promises";

import { hashObject } from "../utils.js";

export interface CacheKeyInput {
	readonly taskName: string;
	readonly inputs: string[];
}

export type CacheKey = string;
export namespace CacheKey {
	export async function compute(cacheKeyInput: CacheKeyInput): Promise<{ cacheKey: CacheKey; inputHashes: Record<string, string> }> {
		const { inputs, taskName } = cacheKeyInput;
		const inputHashes = await hashInputs(inputs);

		return { inputHashes, cacheKey: hashObject({ taskName, inputs: inputHashes }) };
	}

	async function hashInputs(inputPaths: string[]): Promise<Record<string, string>> {
		const inputHashes = await Promise.all(
			inputPaths.map(async (inputPath) => {
				const hash = Crypto.createHash("sha256");

				hash.update(`path:${inputPath}\n`);
				hash.update(await Fs.readFile(inputPath));
				hash.update("\n---\n");

				return [inputPath, hash.digest("hex")];
			})
		);

		return Object.fromEntries(inputHashes);
	}
}
