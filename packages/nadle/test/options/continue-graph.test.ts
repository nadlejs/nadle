import stripAnsi from "strip-ansi";
import { it, expect, describe } from "vitest";
import { settle, fixture, readConfig, withGeneratedFixture } from "setup";

const files = fixture()
	.packageJson("continue-graph")
	.configRaw(await readConfig("continue.ts"))
	.build();

const out = (result: Awaited<ReturnType<typeof settle>>) => stripAnsi(result.stdout);

// Graph-shape cases for --continue: how a failure partitions a diamond, a chain and
// two sibling main-task trees. Every case but the last runs on the InlineExecutor
// (the harness injects --max-workers 1); the last passes --max-workers 2 so the
// PoolExecutor path is exercised too.
describe("--continue over graph shapes", () => {
	it("runs the surviving branch of a diamond and blocks the join", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`join --continue`);

				// base and goodBranch execute; badBranch and join both have `failing` in
				// their closure, so neither is admissible and neither is "not started".
				expect(result.exitCode).not.toBe(0);
				expect(out(result)).toContain("BASE RAN");
				expect(out(result)).toContain("2 tasks executed, 1 task failed, 2 tasks blocked");
				expect(out(result)).not.toContain("not started");
			}
		}));

	it("blocks a task whose only unmet dependency is itself blocked", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`farDownstream --continue`);

				// farDownstream does not depend on `failing` directly — only through
				// nearDownstream, which never failed itself. A direct-dependency check
				// would call it "not started"; the transitive closure calls it blocked.
				expect(result.exitCode).not.toBe(0);
				expect(out(result)).toContain("1 task failed, 2 tasks blocked");
				expect(out(result)).not.toContain("not started");
			}
		}));

	it("advances to the next main task when the first tree is blocked", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				// Sequential, so gateA is the current main task. Its tree fails and gateA
				// itself is blocked, so no task in that tree ever settles gateA — the
				// walk must still advance to the gateB tree, which is untouched.
				const result = await settle(exec`gateA gateB --continue`);

				expect(result.exitCode).not.toBe(0);
				expect(out(result)).toContain("INDEPENDENT RAN");
				expect(out(result)).toContain("2 tasks executed, 1 task failed, 1 task blocked");
			}
		}));

	it("does not reach the later tree without the flag", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				// Paired control for the case above: same graph, same task list, fail-fast.
				const result = await settle(exec`gateA gateB`);

				expect(result.exitCode).not.toBe(0);
				expect(out(result)).not.toContain("INDEPENDENT RAN");
				expect(out(result)).toContain("not started");
			}
		}));

	it("reports every failure, not just the first", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`failing secondFailing --continue --stacktrace`);

				expect(result.exitCode).not.toBe(0);
				expect(out(result)).toContain("FAILED");
				expect(out(result)).toContain("Task failing FAILED");
				expect(out(result)).toContain("Task secondFailing FAILED");
				expect(out(result)).toContain("2 tasks failed");
				// Only the first failure is rethrown at the end of the run, by design —
				// the exit code and the surfaced error stay what fail-fast would give.
				expect(stripAnsi(result.stderr)).toContain("boom");
				expect(stripAnsi(result.stderr)).not.toContain("bang");
			}
		}));

	it("counts blocked tasks on the pool executor", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				// --max-workers 2 overrides the harness's injected --max-workers 1, so this
				// is the only case here that goes through PoolExecutor rather than
				// InlineExecutor.
				const result = await settle(exec`join independent --continue --parallel --max-workers 2`);

				expect(result.exitCode).not.toBe(0);
				expect(out(result)).toContain("INDEPENDENT RAN");
				expect(out(result)).toContain("BASE RAN");
				expect(out(result)).toContain("3 tasks executed, 1 task failed, 2 tasks blocked");
			}
		}));

	it("emits the not-started token in the agent reporter", () =>
		withGeneratedFixture({
			files,
			testFn: async ({ exec }) => {
				const result = await settle(exec`failing independent --reporter agent`);

				expect(out(result)).toContain("not-started 1");
				expect(out(result)).not.toContain("blocked");
			}
		}));
});
