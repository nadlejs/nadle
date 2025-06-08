import Path from "node:path";

import { expect } from "vitest";
import { noop } from "lodash-es";
import stdMocks from "std-mocks";
import stripAnsi from "strip-ansi";

import { fixturesDir } from "./constants.js";
import { runCli, setupCli } from "../../lib/cli.js";
import { blurSnapshot, type BlurOptions } from "./blur-snapshot.js";

type Env = Readonly<Partial<Record<string, string>>>;

interface NewExecOptions {
	readonly env?: Env;
	readonly cwd?: string;
	readonly config?: string;
	readonly autoDisabledSummary?: boolean;
}

interface NewExecResults {
	readonly stderr: string;
	readonly stdout: string;
}

export type NewExec = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<NewExecResults>;

export function createExec(options?: NewExecOptions): NewExec {
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

		// let env: Env = { CI: "false", TEST: "true", ...options?.env };
		//
		// if (env.CI === "false") {
		// 	// std-env requires GITHUB_ACTIONS to be undefined to not be detected as CI
		// 	env = { ...env, GITHUB_ACTIONS: undefined };
		// }
		//
		// if (env.TEST === "false") {
		// 	// std-env requires TEST to be undefined to not be detected as TEST
		// 	env = { ...env, NODE_ENV: "production" };
		// }

		const originalCwd = process.cwd();
		// const originalEnv = process.env;

		const cwd = options?.cwd || Path.join(fixturesDir, "main");

		process.chdir(cwd);
		console.log(process.env);
		// Object.assign(process.env, { ...originalEnv, ...env });
		// console.log({ env, originalEnv, merge: { ...originalEnv, ...env } });
		stdMocks.use();
		let stdout, stderr;

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

			// for (const [key] of Object.entries(env)) {
			// 	delete process.env[key];
			//
			// 	if (Object.hasOwn(originalEnv, key)) {
			// 		process.env[key] = originalEnv[key];
			// 	}
			// }
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
