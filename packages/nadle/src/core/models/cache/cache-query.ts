import { type CacheKey } from "./cache-key.js";
import type { TaskIdentifier } from "../task/task-identifier.js";

export interface CacheQuery {
	readonly cacheKey: CacheKey;
	readonly taskId: TaskIdentifier;
}
