export function capitalize(str: string): string {
	if (str.length === 0) {
		return str;
	}

	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function uniqueBy<T, U>(list: T[], keyFn: (item: T) => U): T[] {
	const seen = new Set<U>();
	const uniqueItems: T[] = [];

	for (const item of list) {
		const key = keyFn(item);

		if (!seen.has(key)) {
			seen.add(key);
			uniqueItems.push(item);
		}
	}

	return uniqueItems;
}
