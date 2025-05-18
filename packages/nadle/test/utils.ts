import path from "node:path";

import { expect } from "vitest";
import { execa, type Result, type Options, type ResultPromise, parseCommandString } from "execa";

export const cliPath = path.resolve(import.meta.dirname, "../bin/nadle");
export const fixturesDir = path.resolve(import.meta.dirname, "./fixtures");

interface RunOptions extends Options {
	config?: string;
	autoDisabledSummary?: boolean;
}

export function createExec(options?: RunOptions) {
	const cwd = options?.cwd ?? fixturesDir;
	const configFile = options?.config;
	const autoDisabledSummary = options?.autoDisabledSummary ?? true;
	const configFileName = configFile === undefined ? undefined : configFile.includes(".") ? configFile : `${configFile}.nadle.ts`;

	return (strings: TemplateStringsArray, ...values: unknown[]): ResultPromise => {
		let command = strings.reduce((acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ""), "");

		if (configFile !== undefined) {
			command = `--config ${configFileName} ` + command;
		}

		// Disable summary if not specified
		if (autoDisabledSummary && (!command.includes("--show-summary") || !command.includes("--no-show-summary"))) {
			command = "--no-show-summary " + command;
		}

		// Enforce one worker if not specified
		if (!command.includes("--max-worker")) {
			command = "--max-workers 1 " + command;
		}

		return execa(cliPath, parseCommandString(command), { ...options, cwd });
	};
}

export const exec = createExec();

export async function expectFail(command: () => ResultPromise, options: BlurOptions[] = []) {
	try {
		await command();
	} catch (error) {
		const execaError = error as Result;
		expect(execaError.exitCode).toBe(1);
		expect(blurSnapshot(execaError.stdout, options)).toMatchSnapshot("stdout");
		expect(blurSnapshot(execaError.stderr, options)).toMatchSnapshot("stderr");
	}
}

export async function expectPass(command: ResultPromise, options: BlurOptions[] = []) {
	const { stdout, exitCode } = await command;
	expect(exitCode).toBe(0);
	expect(blurSnapshot(stdout, options)).toMatchSnapshot("stdout");
}

export function blurSnapshot(snapshot: any, options: BlurOptions[] = []) {
	return options.reduce((result, option) => blur(result, option), snapshot);
}

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
