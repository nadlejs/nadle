import { words } from "lodash-es";
import { distance } from "fastest-levenshtein";

interface Matcher {
	readonly name: string;
	match(input: string, pattern: string): boolean;
}

const InitialsMatcher: Matcher = {
	name: "InitialsMatcher",
	match(input: string, pattern: string): boolean {
		return input.toLowerCase() === getInitials(pattern);
	}
};

const FUZZY_MATCH_THRESHOLD = 2;
const MAX_SUGGESTION_DISTANCE = 3;

const fuzzyMatcher: Matcher = {
	name: "FuzzyMatcher",
	match(input: string, pattern: string): boolean {
		return distance(input.toLowerCase(), pattern.toLowerCase()) <= FUZZY_MATCH_THRESHOLD;
	}
};

function match(input: string, allTasks: string[], matcher: Matcher): string[] {
	return allTasks.filter((task) => matcher.match(input, task));
}

export function resolveTask(input: string, allTasks: string[]): { result: string } | { result: undefined; suggestions: string[] } {
	if (allTasks.includes(input)) {
		return { result: input };
	}

	const initialsMatches = match(input, allTasks, InitialsMatcher);

	if (initialsMatches.length === 1) {
		return { result: initialsMatches[0] };
	}

	const fuzzyMatches = match(input, allTasks, fuzzyMatcher);

	if (fuzzyMatches.length === 1) {
		return { result: fuzzyMatches[0] };
	}

	const suggestedTasks = allTasks
		.flatMap((name) => {
			const score = distance(input, name);

			if (score <= MAX_SUGGESTION_DISTANCE) {
				return { name, score };
			}

			return [];
		})
		.sort((a, b) => a.score - b.score)
		.map(({ name }) => name);

	return { result: undefined, suggestions: suggestedTasks };
}

function getInitials(name: string): string {
	return words(name)
		.map((w) => w[0])
		.join("")
		.toLowerCase();
}

export function formatSuggestions(names: string[]): string {
	if (names.length === 0) {
		return "";
	}

	let tasksList;

	if (names.length === 1) {
		tasksList = names[0];
	} else if (names.length === 2) {
		tasksList = `${names[0]} or ${names[1]}`;
	} else {
		tasksList = `${names.slice(0, -1).join(", ")}, or ${names.at(-1)}`;
	}

	return ` Did you mean ${tasksList}?`;
}
