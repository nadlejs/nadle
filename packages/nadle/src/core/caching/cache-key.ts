import { hashObject } from "../utils.js";
import type { FileFingerprints } from "./fingerprint.js";

interface CacheKeyInput {
	readonly taskName: string;
	readonly inputsFingerprints: FileFingerprints;
}

export type CacheKey = string;
export namespace CacheKey {
	export async function compute(input: CacheKeyInput): Promise<CacheKey> {
		return hashObject(input);
	}
}
