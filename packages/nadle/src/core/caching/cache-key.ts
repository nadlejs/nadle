import { hashObject } from "../utilities/hash.js";
import type { FileFingerprints } from "./fingerprint.js";
import type { TaskIdentifier } from "../registration/task-identifier.js";

interface CacheKeyInput {
	readonly taskId: TaskIdentifier;
	readonly inputsFingerprints: FileFingerprints;
}

export type CacheKey = string;
export namespace CacheKey {
	export async function compute(input: CacheKeyInput): Promise<CacheKey> {
		return hashObject(input);
	}
}
