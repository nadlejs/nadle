import { words } from "lodash-es";
import { distance } from "fastest-levenshtein";

import { type Logger } from "../interfaces/logger.js";

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

type SuggestionResult = { result: string } | { result: undefined; suggestions: string[] };

export function suggest(input: string, availableNames: string[], logger: Logger): SuggestionResult {
	logger.debug(`Suggesting for input: '${input}' with [${availableNames.join(", ")}]`);

	if (availableNames.includes(input)) {
		return { result: input };
	}

	const initialsMatches = match(input, availableNames, InitialsMatcher);
	logger.debug(`Using InitialsMatcher: [${initialsMatches.join(", ")}]`);

	if (initialsMatches.length === 1) {
		return { result: initialsMatches[0] };
	}

	const fuzzyMatches = match(input, availableNames, fuzzyMatcher);
	logger.debug(`Using FuzzyMatcher: [${fuzzyMatches.join(", ")}]`);

	if (fuzzyMatches.length === 1) {
		return { result: fuzzyMatches[0] };
	}

	const suggestedTasks = availableNames
		.flatMap((name) => {
			const score = distance(input, name);

			if (score <= MAX_SUGGESTION_DISTANCE) {
				return { name, score };
			}

			return [];
		})
		.sort((a, b) => a.score - b.score)
		.map(({ name }) => name);
	logger.debug(`Using LevenshteinMatcher: [${suggestedTasks.join(", ")}]`);

	return { result: undefined, suggestions: suggestedTasks };
}

function getInitials(name: string): string {
	return words(name)
		.map((w) => w[0])
		.join("")
		.toLowerCase();
}
