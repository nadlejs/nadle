export interface BlurOptions {
	pattern: string | RegExp;
	replacement: string | ((match: string) => string);
}
export function blur(snapshot: string, options?: BlurOptions) {
	if (!options) {
		return snapshot;
	}

	const { pattern, replacement } = options;

	if (typeof pattern === "string") {
		return snapshot.replaceAll(pattern, (match) => (typeof replacement === "string" ? replacement : replacement(match)));
	}

	if (pattern instanceof RegExp) {
		if (!pattern.flags.includes("g")) {
			throw new Error("The regex pattern must have the global flag 'g'");
		}

		return snapshot.replace(pattern, (match) => (typeof replacement === "string" ? replacement : replacement(match)));
	}

	throw new Error("Pattern must be a string or a RegExp");
}
