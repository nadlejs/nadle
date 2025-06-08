import Path from "node:path";

import { expect } from "vitest";
import { noop } from "lodash-es";
import stdMocks from "std-mocks";
import stripAnsi from "strip-ansi";

import { fixturesDir } from "./constants.js";
import { runCli, setupCli } from "../../lib/cli.js";
import { blurSnapshot, type BlurOptions } from "./blur-snapshot.js";

interface NewExecOptions {
	cwd?: string;
	config?: string;
	autoDisabledSummary?: boolean;
}

interface NewExecResults {
	stdout: string;
	stderr: string;
}

type NewExec = (strings: TemplateStringsArray, ...values: unknown[]) => NewExecResults;

export namespace NewExec {
	export function createExec(options?: NewExecOptions) {
		const configFile = options?.config;
		const autoDisabledSummary = options?.autoDisabledSummary ?? true;

		return async (strings: TemplateStringsArray, ...values: unknown[]): Promise<NewExecResults> => {
			let command = strings.reduce((acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ""), "");

			if (configFile !== undefined) {
				command = `--config ${configFile.includes(".") ? configFile : `nadle.${configFile}.ts`} ` + command;
			}

			// Disable summary if not specified
			if (autoDisabledSummary && !command.includes("--show-summary") && !command.includes("--no-show-summary")) {
				command = "--no-show-summary " + command;
			}

			// Enforce one worker if not specified
			if (!command.includes("--max-workers")) {
				command = "--max-workers 1 " + command;
			}

			const originalCwd = process.cwd();

			const cwd = options?.cwd || Path.join(fixturesDir, "main");

			stdMocks.use();
			process.chdir(cwd);
			let error: unknown, stdout, stderr;

			try {
				const argv = await setupCli().parseAsync(command);
				await runCli(argv);
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (_err) {
				noop();
			} finally {
				const flushResult = stdMocks.flush();
				stdout = flushResult.stdout;
				stderr = flushResult.stderr;
				stdMocks.restore();

				process.chdir(originalCwd);
			}

			return { stdout: stdout.join(""), stderr: stderr.join("") };
		};
	}

	export const exec = createExec();

	export async function expectPass(command: Promise<NewExecResults>, options: BlurOptions[] = []) {
		const { stdout } = await command;
		expect(blurSnapshot(stdout, options)).toMatchSnapshot("stdout");
	}

	export async function expectFail(command: () => Promise<NewExecResults>, options: BlurOptions[] = []) {
		const { stdout, stderr } = await command();
		expect(blurSnapshot(stdout, options)).toMatchSnapshot("stdout");
		expect(blurSnapshot(stderr, options)).toMatchSnapshot("stderr");
	}

	export async function getStdout(command: Promise<NewExecResults>, options?: { stripAnsi?: boolean }): Promise<string> {
		const { stdout } = await command;
		// expect(exitCode).toBe(0);

		if (options?.stripAnsi ?? true) {
			return stripAnsi(stdout as string);
		}

		return stdout as string;
	}
}
