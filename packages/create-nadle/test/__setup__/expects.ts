import { expect } from "vitest";
import type { ResultPromise } from "execa";

import { createSnapshotTemplate } from "./exec.js";

export async function expectPass(resultPromise: ResultPromise) {
	const { cwd, stdout, stderr, command, exitCode } = await resultPromise;

	expect(exitCode).toBe(0);
	expect(createSnapshotTemplate({ cwd, command, stdout: stdout as string, stderr: stderr as string })).toMatchSnapshot();
}
