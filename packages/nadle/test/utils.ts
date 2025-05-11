import path from "node:path";

import { execa, type Options, type ResultPromise } from "execa";

export const cliPath = path.resolve(import.meta.dirname, "../bin/nadle");
export const fixturesDir = path.resolve(import.meta.dirname, "./fixtures");

interface RunOptions extends Options {
	config?: string;
}

export function createExec(options?: RunOptions) {
	const cwd = options?.cwd ?? fixturesDir;
	const configFile = options?.config;
	const configFileName = configFile === undefined ? undefined : configFile.includes(".") ? configFile : `${configFile}.nadle.ts`;

	return (strings: TemplateStringsArray, ...values: unknown[]): ResultPromise => {
		let command = strings
			.reduce((acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ""), "")
			.replace("$0", cliPath + (configFileName ? ` --config ${configFileName}` : ""));

		// Disable summary if not specified
		if (!command.includes("--show-summary") || !command.includes("--no-show-summary")) {
			command = command.replace(cliPath, `${cliPath} --no-show-summary`);
		}

		return execa({ ...options, cwd })("sh", ["-c", command]);
	};
}

export const exec = createExec();
