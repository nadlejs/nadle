/**
 * Generic callback type.
 * @template T Return type.
 * @template P Parameter type.
 */
export type Callback<T = unknown, P = void> = (params: P) => T;

/**
 * A value or a callback returning a value.
 * @template T The resolved type.
 */
export type Resolver<T = unknown> = T | Callback<T>;

/**
 * A type representing a value or a promise of a value.
 */
export type Awaitable<T> = T | PromiseLike<T>;
