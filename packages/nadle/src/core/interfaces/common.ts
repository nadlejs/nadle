import type { Nadle } from "../orchestration/nadle.js";

export type Awaitable<T> = T | PromiseLike<T>;
export interface Context {
	readonly nadle: Nadle;
}

export type Callback<T = unknown, P = { context: Context }> = (params: P) => T;
export type Resolver<T = unknown> = T | Callback<T>;
