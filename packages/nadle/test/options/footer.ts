import { it, expect, describe } from "vitest";
import { exec, createExec, serializeANSI } from "setup";

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
		expect(blurStdout).contain(`<Yellow>></Yellow> :<Bold>prepare</BoldDim>`);
	});

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

	it("should show summary when not in CI by default", async () => {
		const { stdout, exitCode } = await createExec({ env: { CI: "false" }, autoDisabledSummary: false })`copy`;

		expect(exitCode).toBe(0);
		expect(serializeANSI(stdout as string)).contain(`<Dim>Tasks      </BoldDim>`);
	});
});
