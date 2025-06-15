import { hashFiles, hashObject } from "../utils.js";

export interface CacheKeyInput {
	readonly taskName: string;
	readonly inputs: string[];
}

export type CacheKey = string;
export namespace CacheKey {
	export async function compute(cacheKeyInput: CacheKeyInput): Promise<{ cacheKey: CacheKey; inputHashes: Record<string, string> }> {
		const { inputs, taskName } = cacheKeyInput;
		const inputHashes = await hashFiles(inputs);

		return { inputHashes, cacheKey: hashObject({ taskName, inputs: inputHashes }) };
	}
}
