import Path from "node:path";

import { execa, parseCommandString, type ResultPromise, type Options as ExecaOptions } from "execa";

import { fixturesDir } from "./constants.js";

interface ExecOptions extends ExecaOptions {
	command: string;
	autoDisabledSummary?: boolean;
	autoInjectMaxWorkers?: boolean;
}

type Exec = (strings: TemplateStringsArray, ...values: unknown[]) => ResultPromise;

export function createExec(options: ExecOptions): Exec {
	// const configFile = options?.config;
	const autoInjectMaxWorkers = options?.autoInjectMaxWorkers ?? true;
	const autoDisabledSummary = options?.autoDisabledSummary ?? true;

	return (strings, ...values) => {
		let command = strings.reduce((acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ""), "");

		// // Disable summary if not specified
		if (autoDisabledSummary && !command.includes("--footer") && !command.includes("--no-footer")) {
			command += " --no-footer";
		}

		// Enforce one worker if not specified
		if (autoInjectMaxWorkers && !command.includes("--max-workers")) {
			command += " --max-workers 1 ";
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

		return execa(options.command, parseCommandString(command), { cwd: Path.join(fixturesDir, "main"), ...options, env });
	};
}

// export const exec = createExec();

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
