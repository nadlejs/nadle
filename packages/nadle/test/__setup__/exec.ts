import Path from "node:path";

import { expect } from "vitest";
import stripAnsi from "strip-ansi";
import { execa, type Result, parseCommandString, type ResultPromise, type Options as ExecaOptions } from "execa";

import { cliPath, fixturesDir } from "./constants.js";

interface ExecOptions extends ExecaOptions {
	config?: string;
	autoDisabledSummary?: boolean;
	autoInjectMaxWorkers?: boolean;
	env?: ExecaOptions["env"] & { CI?: "true" | "false"; TEST?: "true" | "false" };
}

export type Exec = (strings: TemplateStringsArray, ...values: unknown[]) => ResultPromise;

export function createExec(options?: ExecOptions): Exec {
	const configFile = options?.config;
	const autoInjectMaxWorkers = options?.autoInjectMaxWorkers ?? true;
	const autoDisabledSummary = options?.autoDisabledSummary ?? true;

	return (strings, ...values) => {
		let command = strings.reduce((acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ""), "");

		if (configFile !== undefined) {
			command = `--config ${configFile.includes(".") ? configFile : `nadle.${configFile}.ts`} ` + command;
		}

		// Disable summary if not specified
		if (autoDisabledSummary && !command.includes("--show-summary") && !command.includes("--no-show-summary")) {
			command = "--no-show-summary " + command;
		}

		// Enforce one worker if not specified
		if (autoInjectMaxWorkers && !command.includes("--max-workers")) {
			command = "--max-workers 1 " + command;
		}

		let env: ExecOptions["env"] = { CI: "false", TEST: "true", ...options?.env };

		if (env.CI === "false") {
			// std-env requires GITHUB_ACTIONS to be undefined to not be detected as CI
			env = { ...env, GITHUB_ACTIONS: undefined };
		}

		if (env.TEST === "false") {
			// std-env requires TEST to be undefined to not be detected as TEST
			env = { ...env, NODE_ENV: "production" };
		}

		return execa(cliPath, parseCommandString(command), {
			cwd: Path.join(fixturesDir, "main"),
			...options,
			env
		});
	};
}

export const exec = createExec();

export async function getStdout(command: ResultPromise, options?: { stripAnsi?: boolean }): Promise<string> {
	const { stdout, exitCode } = await command;

	expect(exitCode).toBe(0);

	if (options?.stripAnsi ?? true) {
		return stripAnsi(stdout as string);
	}

	return stdout as string;
}

export async function getStderr(command: () => ResultPromise, options?: { stripAnsi?: boolean }): Promise<string> {
	let stderr = "";

	try {
		await command();
		throw new Error("Expected command to fail, but it succeeded.");
	} catch (error) {
		const execaError = error as Result;

		expect(execaError.exitCode).not.toBe(0);

		stderr = execaError.stderr as string;
	}

	if (options?.stripAnsi ?? true) {
		return stripAnsi(stderr);
	}

	return stderr;
}
