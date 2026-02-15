import { hashObject } from "../../utilities/hash.js";
import type { FileFingerprints } from "./fingerprint.js";
import type { TaskIdentifier } from "../task-identifier.js";
import type { TaskEnv } from "../../interfaces/task-configuration.js";

export type CacheKey = string;
export namespace CacheKey {
	interface Input {
		readonly env?: TaskEnv;
		readonly taskId: TaskIdentifier;
		readonly inputsFingerprints: FileFingerprints;
	}

	export async function compute(input: Input): Promise<CacheKey> {
		return hashObject(input);
	}
}

export interface CacheQuery {
	readonly cacheKey: CacheKey;
	readonly taskId: TaskIdentifier;
}
