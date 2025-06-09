import { expect } from "vitest";
import type { Result, ResultPromise } from "execa";

import { blurSnapshot, type BlurOptions } from "./blur-snapshot.js";

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
