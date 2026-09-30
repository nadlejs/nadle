import { it, expect, describe } from "vitest";
import { raw, exec, config, fixture, createExec, serializeANSI, withGeneratedFixture } from "setup";

const SLOW_BODY = "() => new Promise((resolve) => setTimeout(resolve, 1500))";

describe.concurrent("--footer", () => {
	it("should show in-progress summary when enable explicitly", async () => {
		const { stdout, exitCode } = await exec`copy --footer --max-workers 2`;

		expect(exitCode).toBe(0);

		const blurStdout = serializeANSI(stdout as string);

		expect(blurStdout).contain(`<Dim>Duration   </BoldDim> 1s`);
		expect(blurStdout).contain(
			`<Dim>Tasks      </BoldDim> <BrightCyan>3 pending</Cyan> <BrightBlack>|</Cyan> <Yellow>0 running</Yellow> <BrightBlack>|</Yellow> <Green>0 done</Green> <Dim>(3 scheduled)</BoldDim>`
		);
		expect(blurStdout).contain(
			`<Dim>Tasks      </BoldDim> <BrightCyan>1 pending</Yellow> <BrightBlack>|</Yellow> <Yellow>1 running</Yellow> <BrightBlack>|</Yellow> <Green>1 done</Green> <Dim>(3 scheduled)</BoldDim>`
		);
		expect(blurStdout).contain(`<Yellow>></Yellow> <Dim>IDLE</BoldDim>`);
		expect(blurStdout).contain(`<Yellow>></Yellow> <Bold>prepare</BoldDim>`);
	});

	it("should count a skipped task as done, not pending", () =>
		withGeneratedFixture({
			files: fixture()
				.packageJson("footer-skipped")
				.config(
					config()
						.taskWithConfig("a", { onlyIf: raw("() => false") }, "() => {}")
						.taskWithConfig("b", { dependsOn: ["a"] }, SLOW_BODY)
				)
				.build(),
			testFn: async ({ exec: execFixture }) => {
				const { stdout, exitCode } = await execFixture`b --footer`;

				expect(exitCode).toBe(0);

				expect(serializeANSI(stdout as string)).contain(
					`<Dim>Tasks      </BoldDim> <BrightCyan>0 pending</Yellow> <BrightBlack>|</Yellow> ` +
						`<Yellow>1 running</Yellow> <BrightBlack>|</Yellow> <Green>0 done</Green> <Dim>(2 scheduled)</BoldDim>`
				);
			}
		}));

	it("should not show summary when disabled explicitly", async () => {
		const { stdout, exitCode } = await exec`copy --no-footer`;

		expect(exitCode).toBe(0);
		expect(serializeANSI(stdout as string)).not.contain(`<Dim>Tasks      </BoldDim>`);
	});

	it("should not show summary in CI by default", async () => {
		const { stdout, exitCode } = await createExec({ env: { CI: "true" }, autoDisabledSummary: false })`copy`;

		expect(exitCode).toBe(0);
		expect(serializeANSI(stdout as string)).not.contain(`<Dim>Tasks      </BoldDim>`);
	});

	// The default is `!isCI && isTTY`; execa pipes stdout, so the non-TTY default is off.
	it("should not show summary on a non-TTY stdout by default", async () => {
		const { stdout, exitCode } = await createExec({ env: { CI: "false" }, autoDisabledSummary: false })`copy`;

		expect(exitCode).toBe(0);
		expect(serializeANSI(stdout as string)).not.contain(`<Dim>Tasks      </BoldDim>`);
	});
});
