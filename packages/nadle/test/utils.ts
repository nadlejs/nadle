import path from "node:path";

import { expect } from "vitest";
import { execa, type Result, type Options, type ResultPromise } from "execa";

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

		// Disable summary if not specified
		if (!command.includes("--max-worker")) {
			command = command.replace(cliPath, `${cliPath} --max-workers 1`);
		}

		return execa({ ...options, cwd })("sh", ["-c", command]);
	};
}

export const exec = createExec();

export async function expectFail(command: () => ResultPromise, options?: BlurOptions) {
	try {
		await command();
	} catch (error) {
		const execaError = error as Result;
		expect(execaError.exitCode).toBe(1);
		expect(blurSnapshot(execaError.stdout, options)).toMatchSnapshot("stdout");
		expect(blurSnapshot(execaError.stderr, options)).toMatchSnapshot("stderr");
	}
}

export interface BlurOptions {
	pattern: string | RegExp;
	replacement: (match: string) => string;
}
export function blurSnapshot(snapshot: any, options?: BlurOptions) {
	if (!options) {
		return snapshot;
	}

	const { pattern, replacement } = options;

	if (typeof pattern === "string") {
		return snapshot.replaceAll(pattern, replacement(pattern));
	}

	if (pattern instanceof RegExp) {
		if (!pattern.flags.includes("g")) {
			throw new Error("The regex pattern must have the global flag 'g'");
		}

		return (snapshot as string).replace(pattern, (match) => replacement(match));
	}

	throw new Error("Pattern must be a string or a RegExp");
}
