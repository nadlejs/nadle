import { expect } from "vitest";
import type { ResultPromise } from "execa";

import { settle, createSnapshotTemplate } from "./exec.js";

export async function expectFail(resultPromise: ResultPromise) {
	const { cwd, stdout, stderr, command, exitCode } = await settle(resultPromise);

	expect(exitCode).toBe(1);
	expect(createSnapshotTemplate({ cwd, stdout, stderr, command })).toMatchSnapshot();
}

export async function expectPass(resultPromise: ResultPromise) {
	const { cwd, stdout, stderr, command, exitCode } = await settle(resultPromise);

	expect(exitCode).toBe(0);
	expect(createSnapshotTemplate({ cwd, stdout, stderr, command })).toMatchSnapshot();
}
