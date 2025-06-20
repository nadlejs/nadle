interface MatchingResult<T> {
	readonly addedItems: T[];
	readonly removedItems: T[];
	readonly matchedItems: T[];
}

function matchArrays<T>(
	firstArray: readonly T[],
	secondArray: readonly T[],
	isMatched: (a: T, b: T) => boolean = (a, b) => a === b
): MatchingResult<T> {
	const removedItems = firstArray.filter((item) => !secondArray.some((otherItem) => isMatched(item, otherItem)));
	const addedItems = secondArray.filter((item) => !firstArray.some((otherItem) => isMatched(item, otherItem)));
	const matchedItems = firstArray.filter((item) => secondArray.some((otherItem) => isMatched(item, otherItem)));

	return { addedItems, removedItems, matchedItems };
}

type EntryDiff<T, Entry = { value: T; key: string }> =
	| { newEntry: Entry; type: "added-entry" }
	| { removedEntry: Entry; type: "removed-entry" }
	| { oldEntry: Entry; newEntry: Entry; type: "changed-entry" };

export function compareObjects<T>(
	oldObject: Record<string, T>,
	newObject: Record<string, T>,
	isEqual: (oldEntry: T, newEntry: T) => boolean = (oldEntry, newEntry) => oldEntry === newEntry
): EntryDiff<T>[] {
	const oldKeys = Object.keys(oldObject);
	const newKeys = Object.keys(newObject);

	const keyMatchedResults = matchArrays(oldKeys, newKeys);

	return [
		...keyMatchedResults.addedItems.map((newKey) => {
			return { type: "added-entry" as const, newEntry: { key: newKey, value: newObject[newKey] } };
		}),
		...keyMatchedResults.removedItems.map((removedKey) => {
			return { type: "removed-entry" as const, removedEntry: { key: removedKey, value: oldObject[removedKey] } };
		}),
		...keyMatchedResults.matchedItems.flatMap((matchedKey) => {
			const oldValue = oldObject[matchedKey];
			const newValue = newObject[matchedKey];

			if (isEqual(oldValue, newValue)) {
				return [];
			}

			return [
				{
					type: "changed-entry" as const,
					oldEntry: { key: matchedKey, value: oldValue },
					newEntry: { key: matchedKey, value: newValue }
				}
			];
		})
	];
}
