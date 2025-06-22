import { type Options } from "yargs";

import { CLIOptions } from "./cli-options.js";
import { type NadleCLIOptions } from "./types.js";

type Arg = { key: string; value: unknown };

type ArgTransformer = (arg: Arg) => Arg | null;

const aliases = Object.values(CLIOptions)
	.map(({ options }) => (options as Options).alias)
	.filter(Boolean);

const exclude =
	(keyMatcher: string | ((key: string) => boolean)): ArgTransformer =>
	(arg) => {
		if (typeof keyMatcher === "function" && keyMatcher(arg.key)) {
			return null;
		}

		if (typeof keyMatcher === "string" && arg.key === keyMatcher) {
			return null;
		}

		return arg;
	};

const transform =
	(targetKey: string, options: { transformKey?: string; transformValue?: (value: any) => any }): ArgTransformer =>
	(arg) => {
		if (arg.key !== targetKey) {
			return arg;
		}

		if (arg.value === undefined) {
			return null;
		}

		return { key: options.transformKey ?? arg.key, value: options.transformValue ? options.transformValue(arg.value) : arg.value };
	};

const transformers = [
	exclude((key) => aliases.includes(key)),
	exclude((key) => key.includes("-")),
	exclude("$0"),
	exclude("_"),
	exclude("tasks"),
	transform("config", { transformKey: "configPath" }),
	transform("cache", { transformValue: Boolean }),
	transform("exclude", { transformKey: "excludedTasks" })
];

const transformer: ArgTransformer = (arg) => {
	let transformedArg: Arg | null = arg;

	for (const transformer of transformers) {
		transformedArg = transformer(transformedArg);

		if (transformedArg === null) {
			return null;
		}
	}

	return transformedArg;
};

export function resolveCLIOptions(argv: Record<string, unknown>): NadleCLIOptions {
	const resolvedOptions = {};

	for (const [key, value] of Object.entries(argv)) {
		const transformedArg = transformer({ key, value });

		if (transformedArg) {
			Object.assign(resolvedOptions, { [transformedArg.key]: transformedArg.value });
		}
	}

	return resolvedOptions as NadleCLIOptions;
}
