import { expect } from "vitest";
import type { Result, ResultPromise } from "execa";

import { createSnapshotTemplate } from "./exec.js";
import { blurSnapshot, type BlurOptions } from "./blur-snapshot.js";

export async function expectFail(resultPromise: ResultPromise, options: BlurOptions[] = []) {
	try {
		await resultPromise;
	} catch (error) {
		const execaError = error as Result;

		expect(execaError.exitCode).toBe(1);
		expect(blurSnapshot(execaError.stdout, options)).toMatchSnapshot("stdout");
		expect(blurSnapshot(execaError.stderr, options)).toMatchSnapshot("stderr");
	}
}

export async function expectPass(resultPromise: ResultPromise) {
	const { cwd, stdout, stderr, command, exitCode } = await resultPromise;

	expect(exitCode).toBe(0);
	expect(createSnapshotTemplate({ cwd, command, stdout: stdout as string, stderr: stderr as string })).toMatchSnapshot();
}
