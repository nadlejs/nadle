import { hashObject } from "../../utilities/hash.js";
import type { FileFingerprints } from "./fingerprint.js";
import type { TaskIdentifier } from "../task/task-identifier.js";

export type CacheKey = string;
export namespace CacheKey {
	interface Input {
		readonly taskId: TaskIdentifier;
		readonly inputsFingerprints: FileFingerprints;
	}

	export async function compute(input: Input): Promise<CacheKey> {
		return hashObject(input);
	}
}
