import Path from "node:path";

import { expect } from "vitest";
import stdMocks from "std-mocks";

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
}

export type NewExec = (strings: TemplateStringsArray, ...values: unknown[]) => NewExecResults;

export function newCreateExec(options?: NewExecOptions) {
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

		const argv = await setupCli().parseAsync(command);
		await runCli(argv);

		const { stdout } = stdMocks.flush();
		stdMocks.restore();

		process.chdir(originalCwd);

		return { stdout: stdout.join("") };
	};
}

export const newExec = newCreateExec();

export async function newExpectPass(command: Promise<NewExecResults>, options: BlurOptions[] = []) {
	const { stdout } = await command;
	expect(blurSnapshot(stdout, options)).toMatchSnapshot("stdout");
}
