import { expect } from "vitest";
import type { Result, ResultPromise } from "execa";

import { createSnapshotTemplate } from "./exec.js";

export async function expectFail(resultPromise: ResultPromise) {
	try {
		await resultPromise;
		throw new Error("Expected command to fail, but it succeeded.");
	} catch (error) {
		const { cwd, stdout, stderr, command, exitCode } = error as Result;

		expect(exitCode).toBe(1);
		expect(createSnapshotTemplate({ cwd, command, stdout: stdout as string, stderr: stderr as string })).toMatchSnapshot();
	}
}

export async function expectPass(resultPromise: ResultPromise) {
	const { cwd, stdout, stderr, command, exitCode } = await resultPromise;

	expect(exitCode).toBe(0);
	expect(createSnapshotTemplate({ cwd, command, stdout: stdout as string, stderr: stderr as string })).toMatchSnapshot();
}
