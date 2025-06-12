import { type CacheKey } from "./cache-key.js";

export interface CacheQuery {
	readonly taskName: string;
	readonly cacheKey: CacheKey;
}
