/**
 * Utility type representing a value that can be a single item or an array of items.
 */
export type MaybeArray<T> = T | T[];

/**
 * Namespace for MaybeArray utility functions.
 */
export namespace MaybeArray {
	/**
	 * Converts a value that may be a single item or an array into an array.
	 * @param value - The value to convert.
	 * @returns The value as an array.
	 */
	export function toArray<T>(value: MaybeArray<T>): T[] {
		return Array.isArray(value) ? value : [value];
	}
}
