import Path from "node:path";

import { expect } from "vitest";
import stripAnsi from "strip-ansi";
import { execa, type Result, parseCommandString, type ResultPromise, type Options as ExecaOptions } from "execa";

import { serialize } from "./serialize.js";
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
		if (autoDisabledSummary && !command.includes("--footer") && !command.includes("--no-footer")) {
			command = "--no-footer " + command;
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

const createHeader = (label: string) => {
	const dashes = "----------";

	return `${dashes} ${label} `.padEnd(30, "-");
};

export function createSnapshotTemplate(params: { cwd: string; stdout?: string; command: string; stderr?: string }): string {
	let snapshot = `
${createHeader("Context")}
Working Directory: ${params.cwd}
Command: ${params.command}`.trimStart();

	if (params.stdout) {
		snapshot += `\n${createHeader("Stdout")}\n${params.stdout}`;
	}

	if (params.stderr) {
		snapshot += `\n${createHeader("Stderr")}\n${params.stderr}`;
	}

	return snapshot;
}

interface SettledResult {
	cwd: string;
	stdout: string;
	stderr: string;
	command: string;
	exitCode: number | undefined;
}

/**
 * Await a CLI result whether it succeeds or fails, returning the fields needed to
 * build a snapshot. The single place that resolves a ResultPromise; assertions on
 * the exit code live in the callers (getStdout/getStderr/expectPass/expectFail).
 */
export async function settle(resultPromise: ResultPromise): Promise<SettledResult> {
	try {
		const { cwd, stdout, stderr, command, exitCode } = await resultPromise;

		return { cwd, command, exitCode, stdout: stdout as string, stderr: stderr as string };
	} catch (error) {
		const { cwd, stdout, stderr, command, exitCode } = error as Result;

		return { cwd, command, exitCode, stdout: stdout as string, stderr: stderr as string };
	}
}

export async function getStdout(resultPromise: ResultPromise, options?: { stripAnsi?: boolean; serializeAll?: boolean }): Promise<string> {
	const { cwd, stdout, command, exitCode } = await settle(resultPromise);

	expect(exitCode).toBe(0);

	if (options?.serializeAll) {
		return serialize(createSnapshotTemplate({ cwd, stdout, command }));
	}

	if (options?.stripAnsi ?? true) {
		return stripAnsi(createSnapshotTemplate({ cwd, stdout, command }));
	}

	return stdout;
}

export async function getStderr(resultPromise: ResultPromise, options?: { stripAnsi?: boolean }): Promise<string> {
	const { stderr, exitCode } = await settle(resultPromise);

	expect(exitCode).not.toBe(0);

	if (options?.stripAnsi ?? true) {
		return stripAnsi(stderr);
	}

	return stderr;
}
