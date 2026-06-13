import Path from "node:path";
import Fs from "node:fs/promises";

import { execa } from "execa";
import stripAnsi from "strip-ansi";
import type fixturify from "fixturify";
import { it, expect, describe } from "vitest";
import { settle, workspaceFixture, withGeneratedFixture } from "setup";

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
	it("runs only the task whose workspace changed", () =>
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
		}));

	it("reports when nothing is affected", () =>
		withGeneratedFixture({
			files: project,
			testFn: async ({ cwd, exec }) => {
				await gitInit(cwd);

				const result = await settle(exec`build --since HEAD`);

				expect(result.exitCode).toBe(0);
				expect(out(result)).toContain("No requested tasks were affected by changes since");
			}
		}));

	it("errors on an invalid git ref", () =>
		withGeneratedFixture({
			files: project,
			testFn: async ({ cwd, exec }) => {
				await gitInit(cwd);

				const result = await settle(exec`build --since does-not-exist-ref`);

				expect(result.exitCode).not.toBe(0);
				expect(result.stderr).toContain("does-not-exist-ref");
			}
		}));
});
