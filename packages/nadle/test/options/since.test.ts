import Path from "node:path";
import Fs from "node:fs/promises";
import Process from "node:process";

import { execa } from "execa";
import stripAnsi from "strip-ansi";
import type fixturify from "fixturify";
import { it, expect, describe } from "vitest";
import { settle, workspaceFixture, withGeneratedFixture } from "setup";

// The integration fixtures `git init` a temp dir that lives inside the already-
// checked-out repo on CI. On Windows that nesting (plus git's safe.directory rules
// and slower process spawns) makes the child `git` calls hang and time out, which is
// a test-environment artifact, not product behavior. The pure affected-set logic is
// covered cross-platform by test/unit/affected.test.ts; here we drive real git only
// on POSIX runners.
const itPosix = Process.platform === "win32" ? it.skip : it;

const project: fixturify.DirJSON = workspaceFixture({
	root: { tasks: [{ name: "build" }] },
	workspaces: {
		"packages/one": { tasks: [{ name: "build" }] },
		"packages/two": { tasks: [{ name: "build" }] }
	}
});

async function gitInit(cwd: string) {
	await execa("git", ["init", "-q"], { cwd });
	await execa("git", ["config", "user.email", "test@nadle.dev"], { cwd });
	await execa("git", ["config", "user.name", "nadle test"], { cwd });
	await execa("git", ["add", "-A"], { cwd });
	await execa("git", ["commit", "-qm", "baseline"], { cwd });
}

const out = (result: Awaited<ReturnType<typeof settle>>) => stripAnsi(result.stdout);

describe("--since", () => {
	itPosix("runs only the task whose workspace changed", () =>
		withGeneratedFixture({
			files: project,
			testFn: async ({ cwd, exec }) => {
				await gitInit(cwd);
				await Fs.appendFile(Path.join(cwd, "packages/one/package.json"), "\n");

				const result = await settle(exec`build --since HEAD`);

				expect(result.exitCode).toBe(0);
				// packages:one:build ran; packages:two:build did not.
				expect(out(result)).toContain("packages:one:build");
				expect(out(result)).not.toContain("packages:two:build");
			}
		})
	);

	itPosix("reports when nothing is affected", () =>
		withGeneratedFixture({
			files: project,
			testFn: async ({ cwd, exec }) => {
				await gitInit(cwd);

				const result = await settle(exec`build --since HEAD`);

				expect(result.exitCode).toBe(0);
				expect(out(result)).toContain("No requested tasks were affected by changes since");
			}
		})
	);

	itPosix("errors on an invalid git ref", () =>
		withGeneratedFixture({
			files: project,
			testFn: async ({ cwd, exec }) => {
				await gitInit(cwd);

				const result = await settle(exec`build --since does-not-exist-ref`);

				expect(result.exitCode).not.toBe(0);
				expect(result.stderr).toContain("does-not-exist-ref");
			}
		})
	);
});
