import c from "tinyrainbow";
import { words } from "lodash-es";
import { distance } from "fastest-levenshtein";

import { type Logger } from "../reporting/logger.js";
import { RIGHT_ARROW } from "../utilities/constants.js";
import { type TaskRegistry } from "../registration/task-registry.js";
import { TaskIdentifierResolver } from "../registration/task-identifier-resolver.js";

export class TaskResolver {
	public constructor(
		private readonly logger: Logger,
		private readonly taskRegistry: TaskRegistry
	) {}

	public resolve(tasks: string[]) {
		const resolveTaskPairs: { resolved: string; original: string }[] = [];

		const resolvedTasks = tasks
			.map((task) => TaskIdentifierResolver.normalize(task))
			.map((task) => {
				const resolvedTask = resolveTask(task, this.taskRegistry.getAllByName());

				if (resolvedTask.result === undefined) {
					const message = `Task ${c.yellow(c.bold(task))} not found.${formatSuggestions(resolvedTask.suggestions.map((task) => c.yellow(c.bold(task))))}`;
					this.logger.error(message);
					throw new Error(message);
				}

				if (resolvedTask.result !== task) {
					resolveTaskPairs.push({ original: task, resolved: resolvedTask.result });
				}

				return resolvedTask.result;
			});

		if (resolveTaskPairs.length > 0) {
			const maxOriginTaskLength = Math.max(...resolveTaskPairs.map(({ original }) => original?.length ?? 0));
			const message = [
				`Resolved tasks:\n`,
				...resolveTaskPairs.map(
					({ resolved, original }) =>
						`${" ".repeat(4)}${c.yellow(c.bold(original?.padEnd(maxOriginTaskLength, " ")))}  ${RIGHT_ARROW} ${c.green(c.bold(resolved))}\n`
				)
			].join("");
			this.logger.log(message);
		}

		this.logger.info(`Resolved tasks: [ ${resolvedTasks.join(", ")} ]`);

		return resolvedTasks;
	}
}

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

function formatSuggestions(names: string[]): string {
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
